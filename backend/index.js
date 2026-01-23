import express from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import cors from "cors";
import multer from "multer";
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
  forcePathStyle: true, // REQUIRED for SeaweedFS
});

// Helper to ensure bucket exists (Fixes many Access Denied issues)
async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (error) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket ${BUCKET_NAME} not found. Creating...`);
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
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB limit
});

/* =========================
   HLS & S3 HELPERS
========================= */
const uploadToSeaweed = async (localPath, s3Key, contentType) => {
  const fileStream = fs.createReadStream(localPath);
  const uploader = new Upload({
    client: s3Client,
    params: { Bucket: BUCKET_NAME, Key: s3Key, Body: fileStream, ContentType: contentType },
  });
  return uploader.done();
};

const convertToHLS = (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const command = `ffmpeg -y -i "${inputPath}" -c:v h264_nvenc -preset p4 -tune hq -vf "format=yuv420p" -c:a aac -ar 48000 -b:a 128k -start_number 0 -hls_time 6 -hls_list_size 0 -hls_segment_filename "${outputDir}/segment%d.ts" "${outputDir}/index.m3u8"`.replace(/\n/g, " ");
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve();
    });
  });
};

/* =========================
   UPLOAD API
========================= */
app.post("/upload", upload.fields([{ name: "video", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description } = req.body;
    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail[0];

    const videoDoc = await VideoDb.create({ title, description });
    const videoId = videoDoc._id.toString();
    const localHlsDir = path.join(process.cwd(), "temp_hls", videoId);

    // 1. Process HLS
    await convertToHLS(videoFile.path, localHlsDir);

    // 2. Upload HLS Segments
    const files = fs.readdirSync(localHlsDir);
    for (const f of files) {
      const type = f.endsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T";
      await uploadToSeaweed(path.join(localHlsDir, f), `${videoId}/hls/${f}`, type);
    }

    // 3. Upload Thumbnail
    const thumbExt = path.extname(thumbnailFile.originalname);
    await uploadToSeaweed(thumbnailFile.path, `${videoId}/thumbnail${thumbExt}`, thumbnailFile.mimetype);

    // 4. Save Filer URLs to MongoDB
    videoDoc.videoPath = `http://localhost:8888/buckets/${BUCKET_NAME}/${videoId}/hls/index.m3u8`;
    videoDoc.thumbnailPath = `http://localhost:8888/buckets/${BUCKET_NAME}/${videoId}/thumbnail${thumbExt}`;
    await videoDoc.save();

    // 5. Cleanup
    fs.rmSync(localHlsDir, { recursive: true, force: true });
    fs.unlinkSync(videoFile.path);
    fs.unlinkSync(thumbnailFile.path);

    res.status(201).json({ success: true, data: videoDoc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================
   READ & SEARCH APIS
========================= */

// Get All Videos
app.get("/videos", async (req, res) => {
  try {
    const videos = await VideoDb.find().sort({ createdAt: -1 });
    res.json({ success: true, data: videos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Video by ID
app.get("/videos/:id", async (req, res) => {
  try {
    const video = await VideoDb.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    res.json({ success: true, data: video });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search API
app.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Search Query is required" });
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

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
