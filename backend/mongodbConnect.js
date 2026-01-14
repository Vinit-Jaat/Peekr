import mongoose from "mongoose";

const mongooseConnect = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/CloudFairVideoStreaming");
    console.log("mongodb connected");
  } catch (error) {
    console.log(`Mongodb Error : ${error}`);
  }
}

export default mongooseConnect;
