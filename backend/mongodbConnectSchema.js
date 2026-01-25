import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    previewPath: {
      type: String,
    },
    videoPath: {
      type: String,
    },
    preview: {
      spriteBaseUrl: { type: String }, // "/previews/abc123"
      frameInterval: { type: Number, default: 2 }, // seconds
      spriteCount: { type: Number },
      cols: { type: Number, default: 5 },
      rows: { type: Number, default: 5 },
      frameWidth: { type: Number, default: 160 },
      frameHeight: { type: Number, default: 90 },
    },
    thumbnailPath: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
)

const VideoDb = mongoose.model("Videodb", UserSchema);

export default VideoDb;
