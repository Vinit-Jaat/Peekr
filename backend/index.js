import express from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import cors from "cors";
import multer from "multer";
import mongoose from "mongoose";
import { S3Client, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

import mongooseConnect from "./mongodbConnect.js";
import VideoDb from "./mongodbConnectSchema.js";

const app = express();
mongooseConnect();

const BUCKET_NAME = "hls-videos";

/* =========================
   SEAWEEDFS S3 CLIENT
========================= */
const s3Client = new S3Client({
  endpoint: "http://127.0.0.1:8333",
  region: "us-east-1",
  credentials: {
    accessKeyId: "any",
    secretAccessKey: "any",
  },
  forcePathStyle: true,
});

// Ensure bucket exists
async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
    }
  }
}
ensureBucketExists();

/* =========================
   MIDDLEWARE & MULTER
========================= */
app.use(cors({ origin: "http://localhost:5173", methods: ["GET", "POST"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  dest: "temp_uploads/",
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
});

/* =========================
   HLS & S3 HELPERS
========================= */
const uploadToSeaweed = async (localPath, s3Key, contentType) => {
  const stream = fs.createReadStream(localPath);
  const uploader = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: stream,
      ContentType: contentType,
    },
  });
  return uploader.done();
};

const convertToHLS = (inputPath, outputDir) =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const cmd = `ffmpeg -y -i "${inputPath}" -c:v h264_nvenc -preset p4 -tune hq -vf "format=yuv420p" -c:a aac -ar 48000 -b:a 128k -start_number 0 -hls_time 6 -hls_list_size 0 -hls_segment_filename "${outputDir}/segment%d.ts" "${outputDir}/index.m3u8"`;

    exec(cmd, (err) => (err ? reject(err) : resolve()));
  });

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
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile || !thumbnailFile) {
      return res.status(400).json({ message: "Video and thumbnail required" });
    }

    const videoId = new mongoose.Types.ObjectId().toString();
    const localHlsDir = path.join(process.cwd(), "temp_hls", videoId);

    try {
      /* 1. Convert to HLS */
      await convertToHLS(videoFile.path, localHlsDir);

      /* 2. Upload HLS files */
      const hlsFiles = fs.readdirSync(localHlsDir);
      for (const file of hlsFiles) {
        const type = file.endsWith(".m3u8")
          ? "application/x-mpegURL"
          : "video/MP2T";

        await uploadToSeaweed(
          path.join(localHlsDir, file),
          `${videoId}/hls/${file}`,
          type
        );
      }

      /* 3. Upload thumbnail */
      const thumbExt = path.extname(thumbnailFile.originalname);
      await uploadToSeaweed(
        thumbnailFile.path,
        `${videoId}/thumbnail${thumbExt}`,
        thumbnailFile.mimetype
      );

      /* 4. Create MongoDB entry ONLY after success */
      const videoDoc = await VideoDb.create({
        _id: videoId,
        title: req.body.title,
        description: req.body.description,
        videoPath: `http://localhost:8888/buckets/${BUCKET_NAME}/${videoId}/hls/index.m3u8`,
        thumbnailPath: `http://localhost:8888/buckets/${BUCKET_NAME}/${videoId}/thumbnail${thumbExt}`,
      });

      res.status(201).json({ success: true, data: videoDoc });
    } catch (error) {
      console.error("Upload failed:", error);
      res.status(500).json({ message: "Upload failed" });
    } finally {
      /* 5. Cleanup ALWAYS */
      try {
        if (fs.existsSync(localHlsDir))
          fs.rmSync(localHlsDir, { recursive: true, force: true });

        if (fs.existsSync(videoFile.path)) fs.unlinkSync(videoFile.path);
        if (fs.existsSync(thumbnailFile.path)) fs.unlinkSync(thumbnailFile.path);
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }
  }
);

/* =========================
   READ & SEARCH APIS
========================= */
app.get("/videos", async (req, res) => {
  try {
    const videos = await VideoDb.find().sort({ createdAt: -1 });
    res.json({ success: true, data: videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/videos/:id", async (req, res) => {
  try {
    const video = await VideoDb.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Search query required" });

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

app.listen(3000, () =>
  console.log("Backend running on http://localhost:3000")
);
