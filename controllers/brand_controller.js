import AsyncHandler from "express-async-handler";
import Brand from "../models/brandModel.js";
import { file_path_extractor } from "../utils/multer/file_path_extractor.js";

// GET /api/admin/brands
export const get_all_brands = AsyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const skip = (page - 1) * limit;

  const total_brand_count = await Brand.countDocuments(
    {},
    { updated_at: false, created_at: false }
  );
  const totalPages = Math.ceil(total_brand_count / limit);

  const brands = await Brand.find({}, { updated_at: false, created_at: false })
    .skip(skip)
    .limit(limit);
  if (brands.length === 0) {
    res.json({ message: "database is empty", brands: [] });
  }
  return res.json({ success: true, page, totalPages, brands });
});

// POST /api/admin/brands
export const add_new_brand = AsyncHandler(async (req, res) => {
  const { name, status } = req.body;
  const logo_path = req.file && req.file.path;

  const brand = await Brand.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });

  if (brand) {
    return res
      .status(409)
      .json({ success: false, message: "Brand with the name already exists" });
  }

  const logo = file_path_extractor(logo_path);

  const new_brand = await Brand.create({
    name,
    status,
    logo,
    updated_at: Date.now(),
  });

  res.status(201).json({ success: true, new_brand });
});

// PATCH /api/admin/brands
export const update_brand_status = AsyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Brand ID is required" });
  }

  const brand_data = await Brand.findById(id);

  if (!brand_data) {
    return res.status(404).json({ success: false, message: "Brand not found" });
  }

  brand_data.status = !brand_data.status;

  await brand_data.save();

  res.status(200).json({
    success: true,
    message: "Status updated successfully",
    status: brand_data.status,
  });
});

// PUT /api/admin/brands
export const update_brand = AsyncHandler(async (req, res) => {
  const brand = req.body;
  const logo_path = req?.file && req?.file?.path;

  if (!brand.id) {
    return res
      .status(400)
      .json({ success: false, message: "Brand ID is required" });
  }

  const brand_data = await Brand.findById(brand.id);

  if (!brand_data) {
    return res.status(404).json({ success: false, message: "Brand not found" });
  }

  let is_updated = false;
  if (brand?.name && brand?.name !== brand_data.name) {
    brand_data.name = brand?.name;
    is_updated = true;
  }

  const logo = logo_path && file_path_extractor(logo_path);
  if (logo) {
    brand_data.logo = logo;
    is_updated = true;
  }

  if (
    typeof brand?.status === "boolean" &&
    brand?.status !== brand_data.status
  ) {
    brand_data.status = brand?.status;
    is_updated = true;
  }

  if (is_updated) {
    brand_data.updatedAt = Date.now();
  }

  await brand_data.save();

  res.json({ success: true, brand_data });
});
