import express from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import cors from "cors";
import multer from "multer";
import mongoose from "mongoose";

import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

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

/* =========================
   MIDDLEWARE
========================= */
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   MULTER
========================= */
const upload = multer({
  dest: "temp_uploads/",
  limits: { fileSize: 10 * 1024 * 1024 * 1024 },
});

/* =========================
   HELPERS
========================= */
const uploadToSeaweed = async (localPath, key, contentType) => {
  const stream = fs.createReadStream(localPath);
  return new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: stream,
      ContentType: contentType,
    },
  }).done();
};

const convertToHLS = (input, outDir) =>
  new Promise((resolve, reject) => {
    fs.mkdirSync(outDir, { recursive: true });
    const cmd = `ffmpeg -y -i "${input}" -c:v h264_nvenc -vf format=yuv420p -c:a aac -hls_time 6 -hls_list_size 0 -hls_segment_filename "${outDir}/segment%d.ts" "${outDir}/index.m3u8"`;
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
    const video = req.files?.video?.[0];
    const thumb = req.files?.thumbnail?.[0];
    if (!video || !thumb)
      return res.status(400).json({ message: "Files missing" });

    const videoId = new mongoose.Types.ObjectId().toString();
    const hlsDir = path.join("temp_hls", videoId);

    try {
      await convertToHLS(video.path, hlsDir);

      for (const f of fs.readdirSync(hlsDir)) {
        await uploadToSeaweed(
          path.join(hlsDir, f),
          `${videoId}/hls/${f}`,
          f.endsWith(".m3u8")
            ? "application/x-mpegURL"
            : "video/MP2T"
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
        videoPath: `http://localhost:8888/buckets/${BUCKET_NAME}/${videoId}/hls/index.m3u8`,
        thumbnailPath: `http://localhost:8888/buckets/${BUCKET_NAME}/${videoId}/thumbnail${ext}`,
      });

      res.json({ success: true, data: doc });
    } catch (e) {
      res.status(500).json({ message: "Upload failed" });
    } finally {
      fs.rmSync(hlsDir, { recursive: true, force: true });
      fs.unlinkSync(video.path);
      fs.unlinkSync(thumb.path);
    }
  }
);

/* =========================
   READ APIS
========================= */
app.get("/videos", async (_, res) => {
  res.json({ success: true, data: await VideoDb.find() });
});

app.get("/search", async (req, res) => {
  const q = req.query.q;
  res.json({
    success: true,
    data: await VideoDb.find({
      $or: [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ],
    }),
  });
});

app.get("/videos/:id", async (req, res) => {
  try {
    const video = await VideoDb.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    res.json({ success: true, data: video });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch video" });
  }
});


/* =========================
   DELETE FROM SEAWEEDFS
========================= */
const deleteFromSeaweed = async (videoId) => {
  const prefix = `${videoId}/`;
  let token;

  do {
    const res = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );

    if (!res.Contents?.length) break;

    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: res.Contents.map(o => ({ Key: o.Key })),
        },
      })
    );

    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  // 🔥 FORCE DELETE DIRECTORY PLACEHOLDERS
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: `${videoId}/hls/` })
  );
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: `${videoId}/` })
  );
};

/* =========================
   DELETE API
========================= */
app.delete("/videos/:id", async (req, res) => {
  const video = await VideoDb.findById(req.params.id);
  if (!video) return res.sendStatus(404);

  await deleteFromSeaweed(video._id.toString());
  await VideoDb.deleteOne({ _id: video._id });

  res.json({ success: true });
});

/* =========================
   START SERVER
========================= */
app.listen(3000, () =>
  console.log("Backend running on http://localhost:3000")
);
