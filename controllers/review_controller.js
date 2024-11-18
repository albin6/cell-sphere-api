import AsyncHandler from "express-async-handler";
import Product from "../models/productModel.js";

// for getting all reviews
export const get_all_reviews_and_ratings = AsyncHandler(async (req, res) => {
  const { productId } = req.query;

  const product_data = await Product.findById(productId)
    .select("reviews")
    .populate({
      path: "reviews.user",
      select: "first_name last_name",
    });

  if (!product_data) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.status(200).json({
    message: "Reviews retrieved successfully",
    reviews: product_data.reviews,
  });
});

// for adding a new review
export const add_new_review_and_rating = AsyncHandler(async (req, res) => {
  const { rating, comment, productId } = req.body;

  const user_id = req.user.id;

  const product_data = await Product.findById(productId);

  if (!product_data) {
    return res.status(404).json({ message: "Product not found" });
  }

  const newReview = {
    user: user_id,
    rating,
    comment,
    created_at: Date.now(),
  };

  product_data.reviews.push(newReview);

  await product_data.save();

  return res
    .status(201)
    .json({ message: "Review added successfully", product: product_data });
});
