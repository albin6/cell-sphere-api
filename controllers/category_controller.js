import AsyncHandler from "express-async-handler";
import Category from "../models/categoryModel.js";

// GET /api/admin/categories
export const get_all_categories = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const total_category_count = await Category.countDocuments(
    {},
    { createdAt: false, updatedAt: false }
  );
  const totalPages = Math.ceil(total_category_count / limit);

  const categories_data = await Category.find(
    {},
    { createdAt: false, updatedAt: false }
  )
    .skip(skip)
    .limit(limit);

  res.json({ success: true, page, totalPages, categories_data });
});

// POST /api/admin/categories
export const add_new_category = AsyncHandler(async (req, res) => {
  const { title, status, description } = req.body;

  const is_category_exists = await Category.findOne({
    title: { $regex: new RegExp(`^${title}$`, "i") },
  });

  if (is_category_exists) {
    return res.status(409).json({ message: "Category Already Exists" });
  }

  const new_category = await Category.create({
    title,
    status,
    description,
  });

  if (new_category) {
    res.json({ success: true, message: "New Category Added Successfully" });
  }
});

// PUT /api/admin/categories
export const update_category = AsyncHandler(async (req, res) => {
  const category = req.body;
  const category_data = await Category.findById(category._id);

  let is_updated = false;
  if (category.title && category.title !== category_data.title) {
    category_data.title = category.title;
    is_updated = true;
  }

  if (
    category.description &&
    category.description !== category_data.description
  ) {
    category_data.description = category.description;
    is_updated = true;
  }

  if (category.status !== category_data.status) {
    category_data.status = category.status;
    is_updated = true;
  }

  if (is_updated) {
    category_data.updatedAt = Date.now();
  }
  await category_data.save();

  res.json({ success: true, category_data });
});

// PATCH /api/admin/categories
export const update_category_status = AsyncHandler(async (req, res) => {
  const { categoryId } = req.body;

  const category_data = await Category.findById(categoryId);

  category_data.status = !category_data.status;

  await category_data.save();

  res.json({ success: true, category_data });
});

// @desc getting all categories for apply offers on
export const get_all_categories_for_offers = AsyncHandler(async (req, res) => {
  const categories_data = await Category.find(
    { status: true },
    { title: true }
  );

  res.json({ success: true, categories_data });
});
