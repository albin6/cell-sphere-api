import mongoose from "mongoose";
import User from "./models/userModel.js";

function generateReferralCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";

  for (let i = 0; i < 5; i++) {
    randomPart += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return `${timestamp}${randomPart}`;
}

mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING)
  .then(async () => {
    const usersWithoutReferralCode = await User.find({
      referral_code: { $exists: false },
    });

    for (let user of usersWithoutReferralCode) {
      user.referral_code = generateReferralCode();
      await user.save();
    }

    mongoose.connection.close();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
