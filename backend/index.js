import express from "express";
import fs from 'fs';
import path from 'path';
import mongooseConnect from "./mongodbConnect.js";
import VideoDb from "./mongodbConnectSchema.js";
import multer from 'multer';
import cors from 'cors';

const app = express();
mongooseConnect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const tempDir = "databaseVideos/temp";
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({
  storage, limits: {
    fileSize: 1024 * 1024 * 100,
  },
});

// also add max upload of video and thumbnail to 1
app.post('/upload',
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]), async (req, res) => {

    try {
      const { title, description } = req.body;

      if (!req.files?.video || !req.files?.thumbnail) {
        return res.status(400).json({ message: "Video and thumbnail required" });
      }

      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail[0];

      const videoData = await VideoDb.create({
        title,
        description
      });

      const videoId = videoData._id.toString();
      const videoDir = `databaseVideos/${videoId}`;
      fs.mkdirSync(videoDir, { recursive: true })

      const videoPath = `${videoDir}/video${path.extname(videoFile.originalname)}`;
      const thumbnailPath = `${videoDir}/thumbnail${path.extname(thumbnailFile.originalname)}`;

      fs.renameSync(videoFile.path, videoPath);
      fs.renameSync(thumbnailFile.path, thumbnailPath);

      videoData.videoPath = videoPath;
      videoData.thumbnailPath = thumbnailPath;
      await videoData.save();

      res.status(201).json({
        message: "Video saved successfully",
        data: videoData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error: error.message
      })
    }
    console.log("Data recieved from /upload endpoint");
    console.log(req.body);
    console.log(req.file.video[0]);
    console.log(req.file.thumbnail[0]);
    console.log("upload successfull")
  })

app.listen(3000, () => {
  console.log("Backend server is running on port 3000");
  console.log("Frontend server is running on port 5173");
})
