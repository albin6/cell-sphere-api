import AsyncHandler from "express-async-handler";
import Banner from "../models/bannerModel.js";

// for adding new banner
// POST /api/admin/banner
export const add_new_banner = AsyncHandler(async (req, res) => {
  const { description, status, image, heading_one, heading_four, expires_at } =
    req.body;

  const banner = new Banner({
    description,
    status,
    image,
    heading_one,
    heading_four,
    expires_at,
  });

  const createdBanner = await banner.save();
  res.status(201).json(createdBanner);
});

// for getting the banners
// GET /api/admin/banner
export const get_banners = AsyncHandler(async (req, res) => {
  const { currentPage = 1, itemsPerPage = 10 } = req.query;

  const page = parseInt(currentPage, 10);
  const limit = parseInt(itemsPerPage, 10);
  const startIndex = (page - 1) * limit;

  const total = await Banner.countDocuments();
  const banners = await Banner.find()
    .limit(limit)
    .skip(startIndex)
    .sort({ expires_at: -1 });

  res.json({
    currentPage,
    itemsPerPage,
    totalPages: Math.ceil(total / limit),
    banners,
  });
});

// for getting all active banner in user side
// GET /api/users/banner
export const get_all_active_banners = AsyncHandler(async (req, res) => {
  const banners = await Banner.find({ status: true });

  res.json(banners);
});

// for updating banner status
// PATCH /api/admin/banner
export const update_banner_status = AsyncHandler(async (req, res) => {
  const { bannerId } = req.body;

  const banner = await Banner.findById(bannerId);

  if (!banner) {
    return res.status(404).json({ message: "Banner not found" });
  }

  banner.status = !banner.status;

  await banner.save();

  res.json({ message: "Banner status updated successfully" });
});

// for deleting a banner
// DELETE /api/admin/banner
export const delete_banner = AsyncHandler(async (req, res) => {
  const banner = await Banner.deleteOne({ _id: req.query.bannerId });

  if (!banner) {
    return res.status(404).json({ message: "Banner not found" });
  }

  res.status(200).json({ message: "Banner deleted successfully" });
});
