import mongoose from "mongoose";

const user_schema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone_number: {
    type: Number,
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  image_url: {
    type: String,
  },
  created_on: {
    type: Date,
    default: Date.now,
  },
  has_seen: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    default: "user",
  },
  referral_code: {
    type: String,
    default: generateReferralCode,
  },
});

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

const User = mongoose.model("user", user_schema);

export default User;
