import AsyncHandler from "express-async-handler";
import Coupon from "../models/couponModel.js";
import Category from "../models/categoryModel.js";

// for adding new coupon
export const add_new_coupon = AsyncHandler(async (req, res) => {
  const {
    code,
    description,
    discount_type,
    discount_value,
    min_purchase_amount,
    max_discount_amount,
    expiration_date,
    usage_limit,
    eligible_categories,
  } = req.body;

  if (
    !code ||
    !description ||
    !discount_type ||
    !discount_value ||
    !min_purchase_amount ||
    !max_discount_amount ||
    !expiration_date ||
    !usage_limit ||
    !eligible_categories
  ) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  const existing_coupon = await Coupon.findOne({
    code: { $regex: new RegExp(code, "i") },
  });

  if (existing_coupon) {
    return res.status(400).json({ message: "Coupon code already exists" });
  }

  const category_data = await Category.findOne({
    _id: { $in: eligible_categories },
  });

  if (!category_data) {
    return res.status(400).json({ message: "Invalid category" });
  }

  const new_coupon = await Coupon.create({
    code,
    description,
    discount_type,
    discount_value,
    min_purchase_amount,
    max_discount_amount,
    expiration_date,
    usage_limit,
    eligible_categories,
  });

  res.status(201).json({ success: true, data: new_coupon });
});

// for getting coupons in admin
// GET /api/admin/coupons
export const get_coupons = AsyncHandler(async (req, res) => {
  const { currentPage = 1, itemsPerPage = 10 } = req.query;

  const page = parseInt(currentPage, 10);
  const limit = parseInt(itemsPerPage, 10);

  const skip = (page - 1) * limit;

  const totalCoupons = await Coupon.countDocuments();

  const totalPages = Math.ceil(totalCoupons / limit);

  const coupons = await Coupon.find({})
    .populate({
      path: "eligible_categories",
      select: "_id title",
    })
    .skip(skip)
    .limit(limit)
    .exec();

  res.status(200).json({
    coupons,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
  });
});

// for getting coupons by user
// GET /api/users/coupons
export const get_coupons_user = AsyncHandler(async (req, res) => {
  const { currentPage = 1, itemsPerPage = 10 } = req.query;

  const page = parseInt(currentPage, 10);
  const limit = parseInt(itemsPerPage, 10);

  const skip = (page - 1) * limit;

  const totalCoupons = await Coupon.countDocuments({ is_active: true });

  const totalPages = Math.ceil(totalCoupons / limit);

  const coupons_data = await Coupon.find({ is_active: true })
    .populate("eligible_categories")
    .skip(skip)
    .limit(limit)
    .exec();

  const coupons = coupons_data.map((c) => ({
    _id: c._id,
    discount_value: c.discount_value,
    discount_type: c.discount_type,
    expiration_date: c.expiration_date,
    description: c.description,
    code: c.code,
    eligible_categories: c.eligible_categories.map((ec) => ({
      _id: ec._id,
      title: ec.title,
    })),
  }));

  res.status(200).json({
    coupons,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
  });
});

// for updating coupon status
export const update_coupon_status = AsyncHandler(async (req, res) => {
  const { couponId } = req.body;

  if (!couponId) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  const coupon_data = await Coupon.findById(couponId);

  if (!coupon_data) {
    return res.status(404).json({ message: "Coupon not found" });
  }

  coupon_data.is_active = !coupon_data.is_active;

  await coupon_data.save();

  res.status(200).json({ success: true, data: coupon_data });
});

// for deleting coupon
export const delete_coupon = AsyncHandler(async (req, res) => {
  const { couponId } = req.body;

  if (!couponId) {
    return res.status(400).json({ message: "Invalid request data" });
  }

  const coupon_data = await Coupon.deleteOne({ _id: couponId });

  if (coupon_data.deletedCount === 0) {
    return res.status(404).json({ message: "Coupon not found" });
  }

  res
    .status(200)
    .json({ success: true, message: "Coupon deleted successfully" });
});

// for applying coupon
export const apply_coupon = AsyncHandler(async (req, res) => {
  const items = req.body;
  const { code } = items[0];

  const coupon = await Coupon.findOne({ code });

  if (!coupon) {
    return res.status(404).json({ message: "Coupon not found" });
  }

  if (!coupon.is_active) {
    return res.status(400).json({ message: "Coupon is not active" });
  }

  const currentDate = new Date();
  if (coupon.expiration_date < currentDate) {
    return res.status(400).json({ message: "Coupon has expired" });
  }

  const response = [];

  console.log(items);
  for (const item of items) {
    const { id, amount } = item;

    const isCategoryEligible = coupon.eligible_categories.some((categoryId) => {
      console.log(categoryId == (id._id || id));
      return categoryId == (id._id || id);
    });

    console.log("is eligible", isCategoryEligible);

    if (!isCategoryEligible) {
      response.push({
        id,
        message: "This product category is not eligible for the coupon",
        discountAmount: 0,
        total_after_discount: amount,
      });
      continue;
    }

    if (coupon.min_purchase_amount > amount) {
      response.push({
        id,
        message: "Coupon minimum purchase amount not met",
        discountAmount: 0,
        total_after_discount: amount,
      });
      continue;
    }

    const appliedUser = coupon.users_applied.find(
      (entry) => entry.user.toString() === req.user.id
    );

    if (appliedUser && appliedUser.used_count >= coupon.usage_limit) {
      response.push({
        id,
        message: "Coupon usage limit reached for this user",
        discountAmount: 0,
        total_after_discount: amount,
      });
      continue;
    }

    let discountAmount;
    if (coupon.discount_type === "percentage") {
      discountAmount = Math.ceil((amount * coupon.discount_value) / 100);
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }
    } else {
      discountAmount = coupon.discount_value;
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }
    }

    const total_after_discount = amount - discountAmount;

    response.push({
      id,
      message: "Coupon applied successfully",
      original_amount: amount,
      discountAmount,
      total_after_discount,
    });
  }

  res.status(200).json(response);
});
