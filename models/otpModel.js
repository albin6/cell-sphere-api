import mongoose from "mongoose";
import sendVerificationEmail from "../utils/nodemailer/sendVerificationEmail.js";

const otp_schema = new mongoose.Schema({
  otp: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

otp_schema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

otp_schema.pre("save", async function (next) {
  if (this.isNew) {
    await sendVerificationEmail(this.email, this.otp);
  }
  next();
});

const OTP = mongoose.model("OTP", otp_schema);

export default OTP;
