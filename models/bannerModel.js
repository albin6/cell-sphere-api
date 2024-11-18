import mongoose from "mongoose";

const banner_schema = new mongoose.Schema({
  description: {
    type: String,
  },
  status: {
    type: Boolean,
  },
  image: {
    type: String,
  },
  heading_one: {
    type: String,
  },
  heading_four: {
    type: String,
  },
  expires_at: {
    type: Date,
    default: Date.now,
  },
});

// Corrected line here
banner_schema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const Banner = mongoose.model("banner", banner_schema);

export default Banner;
