import AsyncHandler from "express-async-handler";
import Product from "../models/productModel.js";

export const get_best_selling = AsyncHandler(async (req, res) => {
  const limit = 10;

  const [best_selling_products, best_selling_categories, best_selling_brands] =
    await Promise.all([
      Product.aggregate([
        { $match: { is_active: true } },
        { $sort: { quantity_sold: -1 } },
        { $project: { name: 1, quantity_sold: 1 } },
        { $limit: limit },
      ]),

      Product.aggregate([
        { $match: { is_active: true } },
        {
          $group: {
            _id: "$category",
            totalSold: { $sum: { $toInt: "$quantity_sold" } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $unwind: {
            path: "$categoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: "$categoryDetails.title",
            totalSold: 1,
          },
        },
      ]),

      Product.aggregate([
        { $match: { is_active: true } },
        {
          $group: {
            _id: "$brand",
            totalSold: { $sum: { $toInt: "$quantity_sold" } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "brands",
            localField: "_id",
            foreignField: "_id",
            as: "brandDetails",
          },
        },
        {
          $unwind: { path: "$brandDetails", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            name: "$brandDetails.name",
            totalSold: 1,
          },
        },
      ]),
    ]);

  res.json({
    success: true,
    products: best_selling_products,
    categories: best_selling_categories,
    brands: best_selling_brands,
  });
});
