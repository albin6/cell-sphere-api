import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log("database connected successfully");
  } catch (error) {
    console.log(error);
  }
}

export default connectDB;
