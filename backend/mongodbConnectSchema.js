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
    videoPath: {
      type: String,
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
