import express from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import cors from "cors";
import multer from "multer";

import mongooseConnect from "./mongodbConnect.js";
import VideoDb from "./mongodbConnectSchema.js";

const app = express();
mongooseConnect();

/* =========================
   CORS — MUST BE FIRST
========================= */
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

/* =========================
   BODY PARSERS
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES (HLS)
========================= */
app.use(
  "/databaseVideos",
  cors({ origin: "*" }),
  express.static(path.join(process.cwd(), "databaseVideos"))
);

/* =========================
   MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = "databaseVideos/temp";
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 10000 },
});

/* =========================
   HLS CONVERTER
========================= */
const convertToHLS = (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(outputDir, { recursive: true });

    const command = `
      ffmpeg -y -i "${inputPath}"
      -profile:v baseline
      -level 3.0
      -start_number 0
      -hls_time 6
      -hls_list_size 0
      -hls_segment_filename "${outputDir}/segment%d.ts"
      "${outputDir}/index.m3u8"
    `.replace(/\n/g, " ");

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

/* =========================
   UPLOAD API
========================= */
app.post(
  "/upload",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description } = req.body;

      if (!req.files?.video || !req.files?.thumbnail) {
        return res.status(400).json({ message: "Video and thumbnail required" });
      }

      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail[0];

      const videoDoc = await VideoDb.create({ title, description });
      const videoId = videoDoc._id.toString();

      const videoDir = `databaseVideos/${videoId}`;
      const hlsDir = path.join(videoDir, "hls");

      fs.mkdirSync(videoDir, { recursive: true });

      const tempVideoPath = path.join(videoDir, "original.mp4");
      const thumbnailPath = `${videoDir}/thumbnail${path.extname(
        thumbnailFile.originalname
      )}`;

      fs.renameSync(videoFile.path, tempVideoPath);
      fs.renameSync(thumbnailFile.path, thumbnailPath);

      await convertToHLS(tempVideoPath, hlsDir);
      fs.unlinkSync(tempVideoPath);

      videoDoc.videoPath = `${videoDir}/hls/index.m3u8`;
      videoDoc.thumbnailPath = thumbnailPath;
      await videoDoc.save();

      res.status(201).json({
        success: true,
        data: videoDoc,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* =========================
   GET ALL VIDEOS
========================= */
app.get("/videos", async (req, res) => {
  try {
    const videos = await VideoDb.find().sort({ createdAt: -1 });
    res.json({ success: true, data: videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================
   GET SINGLE VIDEO (METADATA ONLY)
========================= */
app.get("/videos/:id", async (req, res) => {
  try {
    const video = await VideoDb.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================
      SEARCH API
========================= */
app.get("/search", async (req, res) => {
  try {
    // FIX: Extract 'q' from req.query (destructuring)
    const { q } = req.query;

    // Now 'q' is a string like "action", not an object like { q: "action" }
    if (!q) {
      return res.status(400).json({ message: "Search Query is required" });
    }

    const videos = await VideoDb.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
