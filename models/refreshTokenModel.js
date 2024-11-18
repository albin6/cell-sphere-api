import mongoose from "mongoose";

const refresh_token_schema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const User = mongoose.model("RefreshToken", refresh_token_schema);

export default User;
