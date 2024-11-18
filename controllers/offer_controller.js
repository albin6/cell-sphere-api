import AsyncHandler from "express-async-handler";
import Offer from "../models/offerModel.js";
import Product from "../models/productModel.js";

// @desc for getting all offers
// GET /api/admin/offers
export const get_all_offers = AsyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const skip = (page - 1) * limit;

  const offers = await Offer.find({}).skip(skip).limit(limit);

  const offers_count = await Offer.countDocuments();

  const totalPages = Math.ceil(offers_count / limit);

  res.status(200).json({ offers, currentPage: page, totalPages });
});

// @desc for adding a new offer
// POST /api/admin/offers
export const add_new_offer = AsyncHandler(async (req, res) => {
  const { name, value, target, targetId, targetName, endDate } = req.body;

  const is_offer_already_exists = await Offer.findOne({ target_id: targetId });

  if (is_offer_already_exists) {
    return res.status(409).json({
      success: false,
      message: `Offer is alreay existing for the ${
        target == "product" ? "product" : "category"
      }`,
    });
  }

  const new_offer = await Offer.create({
    name,
    offer_value: value,
    target_type: target,
    target_id: targetId,
    target_name: targetName,
    end_date: endDate,
  });

  if (target === "product") {
    const product = await Product.findById(targetId).populate("offer");
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (
      value > product?.offer?.offer_value ||
      product?.offer?.offer_value == undefined
    ) {
      product.offer = new_offer._id;
    }
    await product.save();
  } else if (target === "category") {
    const products = await Product.find({ category: targetId }).populate(
      "offer"
    );
    for (const product of products) {
      if (
        value > product?.offer?.offer_value ||
        product?.offer?.offer_value == undefined
      ) {
        product.offer = new_offer._id;
      }
      await product.save();
    }
  }

  res.status(201).json({ success: true, new_offer });
});

// @desc for deleting offer
// DELETE /api/admin/offers
export const delete_offer = AsyncHandler(async (req, res) => {
  const { offerId } = req.body;

  const current_offer = await Offer.findById(offerId);

  const offer = await Offer.deleteOne({ _id: offerId });

  if (!offer) {
    return res.status(404).json({ success: false, message: "Offer not found" });
  }

  if (current_offer.target_type == "product") {
    const product_data = await Product.findOne({
      _id: current_offer.target_id,
    }).populate("offer");

    const is_any_category_offer_exists = await Offer.findOne({
      target_id: product_data.category,
    });

    if (product_data) {
      product_data.offer = is_any_category_offer_exists
        ? is_any_category_offer_exists._id
        : null;
    }
    await product_data.save();
  }

  if (current_offer.target_type == "category") {
    const product_data = await Product.find({
      category: current_offer.target_id,
    }).populate("offer");

    for (const product of product_data) {
      const is_any_product_offer_exists = await Offer.findOne({
        target_id: product._id,
      });
      if (product) {
        product.offer = is_any_product_offer_exists
          ? is_any_product_offer_exists._id
          : null;
      }
      await product.save();
    }
  }

  res.status(200).json({ success: true, message: "Offer deleted" });
});
