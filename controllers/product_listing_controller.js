import AsyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import Brand from "../models/brandModel.js";

export const get_category_product = AsyncHandler(async (req, res) => {
  const { categoryId } = req.query;

  const products = await Product.find({ category: categoryId });

  if (!products) {
    return res
      .status(404)
      .json({ success: false, message: "No products found in this category" });
  }

  res.json({ success: true, products });
});

export const get_products_of_category = AsyncHandler(async (req, res) => {
  const categoryId = req.params.categoryId;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID",
    });
  }

  const term = req.query.term || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const sort = req.query.sort || "featured";
  const skip = (page - 1) * limit;

  const { brand, os, ram, storage } = req.query;

  const filter = {
    category: categoryId,
    is_active: true,
  };

  if (brand) {
    const brandIds = await Brand.find({
      name: { $in: brand },
    }).distinct("_id");
    filter.brand = { $in: brandIds };
  }

  if (os) {
    filter["specifications.os"] = { $in: os };
  }

  if (ram) {
    filter["variants"] = { $elemMatch: { ram: { $in: ram.split(",") } } };
  }

  if (storage) {
    if (filter["variants"]) {
      filter["variants"].$elemMatch.storage = { $in: storage.split(",") };
    } else {
      filter["variants"] = {
        $elemMatch: { storage: { $in: storage.split(",") } },
      };
    }
  }

  if (term) {
    filter["name"] = { $regex: term, $options: "i" };
  }

  const totalProducts = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / limit);

  let sortOption = {};
  switch (sort) {
    case "featured":
      sortOption.isFeatured = -1;
      break;
    case "new-arrivals":
      sortOption.createdAt = -1;
      break;
    case "priceLowHigh":
      sortOption.price = 1;
      break;
    case "priceHighLow":
      sortOption.price = -1;
      break;
    case "discountHighLow":
      sortOption.discount = -1;
      break;
    case "name-asc":
      sortOption.name = 1;
      break;
    case "name-desc":
      sortOption.name = -1;
      break;
    // case "rating":
    //   sortOption.ratng = 1;
    //   break;
    // case "popularity":
    //   sortOption.popularity = 1;
    //   break;
    default:
      break;
  }

  const products = await Product.find(filter)
    .populate("category")
    .populate("brand")
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const categories = await Category.find();
  if (!categories || categories.length === 0) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch categories" });
  }

  const brands = await Brand.find();
  if (!brands || brands.length === 0) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch brands" });
  }

  res.status(200).json({
    success: true,
    products,
    brands,
    categories,
    totalPages,
    currentPage: page,
  });
});

export const get_products_of_brand = AsyncHandler(async (req, res) => {
  const brandId = req.params.brandId;

  if (!mongoose.Types.ObjectId.isValid(brandId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid brand ID",
    });
  }

  const term = req.query.term || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const sort = String(req.query.sort) || "featured";
  const skip = (page - 1) * limit;

  const { storage, ram } = req.query;

  const filter = {
    brand: brandId,
    is_active: true,
    ...(storage &&
      ram && {
        variants: { $elemMatch: { storage, ram } },
      }),
    ...(storage && !ram && { "variants.storage": storage }),
    ...(ram && !storage && { "variants.ram": ram }),
    ...(term && { name: { $regex: term, $options: "i" } }),
  };
  const totalProducts = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / limit);

  const sortOptions = {};
  switch (sort) {
    case "featured":
      sortOptions.isFeatured = -1;
      break;
    case "new-arrivals":
      sortOptions.createdAt = -1;
      break;
    case "priceLowHigh":
      sortOptions.price = 1;
      break;
    case "priceHighLow":
      sortOptions.price = -1;
      break;
    case "discountHighLow":
      sortOptions.discount = -1;
      break;
    case "name-asc":
      sortOptions.name = 1;
      break;
    case "name-desc":
      sortOptions.name = -1;
      break;
    // case "rating":
    //   sortOptions.ratng = 1;
    //   break;
    // case "popularity":
    //   sortOptions.popularity = 1;
    //   break;
    default:
      break;
  }

  const products = await Product.find(filter)
    .populate("category")
    .populate("brand")
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const [categories, brands] = await Promise.all([
    Category.find(),
    Brand.find(),
  ]);

  res.status(200).json({
    success: true,
    products,
    brands,
    categories,
    totalPages,
    currentPage: page,
  });
});

export const get_listing_products_details = AsyncHandler(async (req, res) => {
  const term = req.query.term || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const sort = req.query.sort || "featured";
  const skip = (page - 1) * limit;

  const filter = { is_active: true };

  if (req.query.brand) {
    const brandNames = req.query.brand.split(",");
    const brands = await Brand.find({ name: { $in: brandNames } });

    if (brands.length > 0) {
      filter["brand"] = { $in: brands.map((brand) => brand._id) };
    }
  }

  if (req.query.os) {
    filter["specifications.os"] = { $in: req.query.os.split(",") };
  }
  if (req.query.processorBrand) {
    filter["specifications.processor"] = {
      $regex: new RegExp(req.query.processorBrand.split(",").join("|"), "i"),
    };
  }
  if (req.query.ram) {
    filter["variants.ram"] = { $in: req.query.ram.split(",") };
  }

  if (term) {
    filter["name"] = { $regex: term, $options: "i" };
  }

  const sortObj = {};
  switch (sort) {
    case "featured":
      sortObj.isFeatured = -1;
      break;
    case "new-arrivals":
      sortObj.createdAt = -1;
      break;
    case "priceLowHigh":
      sortObj.price = 1;
      break;
    case "priceHighLow":
      sortObj.price = -1;
      break;
    case "discountHighLow":
      sortObj.discount = -1;
      break;
    case "name-asc":
      sortObj.name = 1;
      break;
    case "name-desc":
      sortObj.name = -1;
      break;
    // case "rating":
    //   sortObj.ratng = 1;
    //   break;
    // case "popularity":
    //   sortObj.popularity = 1;
    //   break;
    default:
      break;
  }

  const [products, totalProducts, categories, brands] = await Promise.all([
    Product.aggregate([
      { $match: filter },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: "$category" },
      { $unwind: "$brand" },
    ]),
    Product.countDocuments(filter),
    Category.find().lean(),
    Brand.find().lean(),
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  res.status(200).json({
    success: true,
    products,
    brands,
    categories,
    totalPages,
    currentPage: page,
    totalProducts,
  });
});
