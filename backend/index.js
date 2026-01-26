import express from "express";
import PQueue from "p-queue";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import cors from "cors";
import multer from "multer";
import mongoose from "mongoose";
import axios from "axios"; // Add this at the top with other importsimport axios from "axios"; // Add this at the top with other imports
import rateLimit from "express-rate-limit";

import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

import { Upload } from "@aws-sdk/lib-storage";

import mongooseConnect from "./mongodbConnect.js";
import VideoDb from "./mongodbConnectSchema.js";

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                // 300 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,                  // 3 uploads per IP per hour
  message: {
    success: false,
    message: "Upload rate limit exceeded. Try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
mongooseConnect();

const ffmpegQueue = new PQueue({
  concurrency: 1,
  intervalCap: 3,
  interval: 60 * 60 * 1000
});

const BUCKET_NAME = "hls-videos";

/* =========================
   SEAWEEDFS CLIENT
========================= */
const s3Client = new S3Client({
  endpoint: "http://127.0.0.1:8333",
  region: "us-east-1",
  credentials: { accessKeyId: "any", secretAccessKey: "any" },
  forcePathStyle: true,
});

/* =========================
   ENSURE BUCKET
========================= */
async function ensureBucketExists() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch {
    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
  }
}
ensureBucketExists();

app.use(globalLimiter);

/* =========================
   MIDDLEWARE
========================= */
//app.use(cors({ origin: "http://localhost:5173" }));
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Range",
    "Accept",
    "X-Requested-With"
  ],
  exposedHeaders: [
    "Content-Range",
    "X-Chunk-Index",
    "Content-Length",
    "Accept-Ranges"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir("temp_uploads");
ensureDir("temp_hls");
ensureDir("temp_preview_hls");
ensureDir("temp_preview_sprites");

/* =========================
   MULTER
========================= */
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join("temp_uploads", Date.now().toString());
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 * 1024 },
});

/* =========================
   HELPER: UPLOAD FILE TO SEAWEEDFS
========================= */
const uploadToSeaweed = async (localPath, key, contentType) => {
  return new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream(localPath),
      ContentType: contentType,
    },
  }).done();
};

/* =========================
   ABR HLS CONVERSION
========================= */
const convertToABRHLS = (input, outDir) =>
  new Promise((resolve, reject) => {
    fs.mkdirSync(outDir, { recursive: true });

    const cmd = `
ffmpeg -y -i "${input}" \
-filter_complex "
[0:v]split=6[v1][v2][v3][v4][v5][v6];
[v1]scale=w=1920:h=1080[v1080];
[v2]scale=w=1280:h=720[v720];
[v3]scale=w=854:h=480[v480];
[v4]scale=w=640:h=360[v360];
[v5]scale=w=426:h=240[v240];
[v6]scale=w=256:h=144[v144]
" \
-map "[v1080]" -map 0:a? -c:v:0 h264_nvenc -rc vbr -cq 28 -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 7500k -preset p4 \
-map "[v720]"  -map 0:a? -c:v:1 h264_nvenc -rc vbr -cq 28 -b:v:1 2800k -maxrate:v:1 3000k -bufsize:v:1 4200k -preset p4 \
-map "[v480]"  -map 0:a? -c:v:2 h264_nvenc -rc vbr -cq 28 -b:v:2 1400k -maxrate:v:2 1500k -bufsize:v:2 2100k -preset p4 \
-map "[v360]"  -map 0:a? -c:v:3 h264_nvenc -rc vbr -cq 28 -b:v:3 800k  -maxrate:v:3 850k  -bufsize:v:3 1200k -preset p4 \
-map "[v240]"  -map 0:a? -c:v:4 h264_nvenc -rc vbr -cq 30 -b:v:4 400k  -maxrate:v:4 450k  -bufsize:v:4 600k  -preset p4 \
-map "[v144]"  -map 0:a? -c:v:5 h264_nvenc -rc vbr -cq 32 -b:v:5 80k   -maxrate:v:5 100k -bufsize:v:5 40k  -preset p7 \
-c:a aac -ar 48000 -b:a 64k \
-f hls \
-hls_time 4 \
-hls_list_size 0 \
-hls_segment_filename "${outDir}/v%v/segment_%03d.ts" \
-master_pl_name master.m3u8 \
-var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3 v:4,a:4 v:5,a:5" \
"${outDir}/v%v/index.m3u8"
`;

    //    const cmd = `
    //ffmpeg -y -i "${input}" \
    //-filter_complex "
    //[0:v]split=6[v1][v2][v3][v4][v5][v6];
    //[v1]scale=w=1920:h=1080[v1080];
    //[v2]scale=w=1280:h=720[v720];
    //[v3]scale=w=854:h=480[v480];
    //[v4]scale=w=640:h=360[v360];
    //[v5]scale=w=426:h=240[v240];
    //[v6]scale=w=256:h=144[v144]
    //" \
    //-map "[v1080]" -map 0:a? -c:v:0 h264_nvenc -b:v:0 5000k -preset p4 \
    //-map "[v720]"  -map 0:a? -c:v:1 h264_nvenc -b:v:1 2800k -preset p4 \
    //-map "[v480]"  -map 0:a? -c:v:2 h264_nvenc -b:v:2 1400k -preset p4 \
    //-map "[v360]"  -map 0:a? -c:v:3 h264_nvenc -b:v:3 800k  -preset p4 \
    //-map "[v240]"  -map 0:a? -c:v:4 h264_nvenc -b:v:4 400k  -preset p4 \
    //-map "[v144]"  -map 0:a? -c:v:5 h264_nvenc -b:v:5 200k  -preset p4 \
    //-c:a aac -ar 48000 \
    //-f hls \
    //-hls_time 6 \
    //-hls_list_size 0 \
    //-hls_segment_filename "${outDir}/v%v/segment_%03d.ts" \
    //-master_pl_name master.m3u8 \
    //-var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3 v:4,a:4 v:5,a:5" \
    //"${outDir}/v%v/index.m3u8"
    //`;

    exec(cmd, (err, stdout, stderr) => {
      console.log("FFMPEG STDOUT:", stdout);
      console.error("FFMPEG STDERR:", stderr);
      if (err) {
        reject(new Error(`FFmpeg conversion failed: ${stderr || err.message}`));
      } else {
        resolve();
      }
    });
  });

const generatePreviewHLS = (input, outDir) =>
  new Promise((resolve, reject) => {
    fs.mkdirSync(outDir, { recursive: true });

    const cmd = `
ffmpeg -y -i "${input}" \
-t 7 \
-an \
-vf scale=426:240 \
-c:v h264_nvenc \
-b:v 300k \
-f hls \
-hls_time 2 \
-hls_list_size 0 \
-hls_segment_filename "${outDir}/segment_%03d.ts" \
"${outDir}/index.m3u8"
`;

    exec(cmd, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });


const generatePreviewSprites = async (input, outDir, interval = 5) => {
  fs.mkdirSync(outDir, { recursive: true });

  const duration = await getVideoDuration(input); // get video duration
  const fps = 1 / interval; // 1 frame every X seconds

  // Each frame will be a separate image, not tiled
  const cmd = `
ffmpeg -y -i "${input}" \
-vf "fps=${fps},scale=160:90" \
"${outDir}/preview_%03d.jpg"
`;

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("FFMPEG SPRITES STDERR:", stderr);
        reject(err);
      } else {
        console.log(`Generated sprites for video (${duration}s) every ${interval}s`);
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
  uploadLimiter,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    let video;
    let thumb;
    let videoId;

    try {
      video = req.files?.video?.[0];
      thumb = req.files?.thumbnail?.[0];

      if (!video || !thumb) {
        return res.status(400).json({
          success: false,
          message: "Files missing",
        });
      }

      videoId = new mongoose.Types.ObjectId().toString();

      const hlsDir = path.join("temp_hls", videoId);
      const previewHlsDir = path.join("temp_preview_hls", videoId);
      const previewSpriteDir = path.join("temp_preview_sprites", videoId);

      //await convertToABRHLS(video.path, hlsDir);

      await ffmpegQueue.add(() => convertToABRHLS(video.path, hlsDir));

      const walk = (dir) =>
        fs.readdirSync(dir)
          .filter((f) => !f.startsWith("."))
          .flatMap((f) => {
            const p = path.join(dir, f);
            return fs.statSync(p).isDirectory() ? walk(p) : [p];
          });

      await generatePreviewHLS(video.path, previewHlsDir);

      for (const file of walk(previewHlsDir)) {
        const rel = path.relative(previewHlsDir, file).replace(/\\/g, "/");
        await uploadToSeaweed(
          file,
          `${videoId}/preview/${rel}`,
          file.endsWith(".m3u8")
            ? "application/vnd.apple.mpegurl"
            : "video/MP2T"
        );
      }

      for (const file of walk(hlsDir)) {
        const rel = path.relative(hlsDir, file).replace(/\\/g, "/");
        await uploadToSeaweed(
          file,
          `${videoId}/hls/${rel}`,
          file.endsWith(".m3u8")
            ? "application/vnd.apple.mpegurl"
            : "video/MP2T"
        );
      }

      await generatePreviewSprites(video.path, previewSpriteDir, 5);

      const spriteFiles = fs
        .readdirSync(previewSpriteDir)
        .filter((f) => f.startsWith("preview_") && f.endsWith(".jpg"));

      for (const file of spriteFiles) {
        await uploadToSeaweed(
          path.join(previewSpriteDir, file),
          `${videoId}/preview/${file}`,
          "image/jpeg"
        );
      }

      const ext = path.extname(thumb.originalname);

      await uploadToSeaweed(
        thumb.path,
        `${videoId}/thumbnail${ext}`,
        thumb.mimetype
      );

      const doc = await VideoDb.create({
        _id: videoId,
        title: req.body.title,
        description: req.body.description,
        previewPath: `http://localhost:8888/buckets/${BUCKET_NAME}/${videoId}/preview/index.m3u8`,
        videoPath: `http://localhost:8888/buckets/${BUCKET_NAME}/${videoId}/hls/master.m3u8`,
        thumbnailPath: `http://localhost:8888/buckets/${BUCKET_NAME}/${videoId}/thumbnail${ext}`,
        preview: {
          spriteBaseUrl: `http://localhost:8888/buckets/${BUCKET_NAME}/${videoId}/preview`,
          frameInterval: 2,
          spriteCount: spriteFiles.length,
          cols: 5,
          rows: 5,
          frameWidth: 160,
          frameHeight: 90,
        },
      });

      res.json({ success: true, data: doc });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: err.message,
      });
    } finally {
      try {
        if (video?.path && fs.existsSync(video.path)) {
          fs.unlinkSync(video.path);
        }

        if (thumb?.path && fs.existsSync(thumb.path)) {
          fs.unlinkSync(thumb.path);
        }

        if (videoId) {
          fs.rmSync(path.join("temp_hls", videoId), {
            recursive: true,
            force: true,
          });

          fs.rmSync(path.join("temp_preview_hls", videoId), {
            recursive: true,
            force: true,
          });

          fs.rmSync(path.join("temp_preview_sprites", videoId), {
            recursive: true,
            force: true,
          });
        }
      } catch (cleanupErr) {
        console.warn("Cleanup warning:", cleanupErr.message);
      }
    }
  }
);

const getVideoDuration = (file) =>
  new Promise((resolve, reject) => {
    exec(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`,
      (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve(parseFloat(stdout));
      }
    );
  });

/* =========================
   READ API
========================= */
app.get("/videos", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      VideoDb.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      VideoDb.countDocuments()
    ]);

    res.json({
      success: true,
      data: videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/videos/:id", async (req, res) => {
  const video = await VideoDb.findById(req.params.id);
  if (!video) return res.status(404).json({ success: false, message: "Video not found" });
  res.json({ success: true, data: video });
});

/* =========================
   DELETE API (UPDATED)
========================= */
const deleteFromSeaweed = async (videoId) => {
  if (!videoId) return;

  // SeaweedFS usually maps S3 buckets to /buckets/BUCKET_NAME/ in the Filer
  // Try both paths if you aren't sure, but this is the standard internal mapping:
  const filerUrl = `http://127.0.0.1:8888/buckets/${BUCKET_NAME}/${videoId}/?recursive=true`;

  try {
    console.log(`Sending recursive delete to: ${filerUrl}`);
    await axios.delete(filerUrl);
    console.log("Entire directory tree nuked.");
  } catch (err) {
    // If it fails, it's likely a 404 (wrong path) or connection error
    console.error(`Filer delete failed: ${err.response?.status} - ${err.message}`);

    // Fallback: If the /buckets/ path fails, try without the /buckets/ prefix
    try {
      const fallbackUrl = `http://127.0.0.1:8888/${BUCKET_NAME}/${videoId}/?recursive=true`;
      await axios.delete(fallbackUrl);
    } catch (fallbackErr) {
      console.error("All Filer delete attempts failed.");
    }
  }
};

app.delete("/videos/:id", async (req, res) => {
  const video = await VideoDb.findById(req.params.id);
  if (!video) return res.sendStatus(404);

  try {
    await deleteFromSeaweed(video._id.toString());
    await VideoDb.deleteOne({ _id: video._id });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to delete video", error: err.message });
  }
});

app.get("/search", async (req, res) => {
  const { q = "", page = 1, limit = 12 } = req.query;

  const skip = (page - 1) * limit;

  const query = {
    title: { $regex: q, $options: "i" }
  };

  const [videos, total] = await Promise.all([
    VideoDb.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VideoDb.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: videos,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

/* =========================
   START SERVER
========================= */
app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
