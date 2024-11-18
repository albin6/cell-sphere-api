import AsyncHandler from "express-async-handler";
import Category from "../models/categoryModel.js";
import Brand from "../models/brandModel.js";
import Product from "../models/productModel.js";
import Offer from "../models/offerModel.js";

// desc => for listing products
// GET /api/admin/products
export const get_products_details = AsyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const skip = (page - 1) * limit;
  const { sort, filter } = req.query;

  const category_id =
    filter == "All"
      ? await Category.find({})
      : await Category.findOne({ _id: filter });

  const total_product_count =
    filter == "All"
      ? await Product.countDocuments()
      : await Product.countDocuments({
          category: category_id?._id,
        });

  const totalPages = Math.ceil(total_product_count / limit);

  const sort_option = {};
  switch (sort) {
    case "name":
      sort_option.name = 1;
      break;
    case "price":
      sort_option.price = 1;
      break;
    default:
      break;
  }

  const products =
    filter == "All"
      ? await Product.find()
          .populate("category")
          .populate("brand")
          .sort(sort_option)
          .skip(skip)
          .limit(limit)
      : await Product.find({ category: category_id._id })
          .populate("category")
          .populate("brand")
          .sort(sort_option)
          .skip(skip)
          .limit(limit);

  const categories = await Category.find({ status: true });
  if (!categories) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch categories" });
  }

  const brands = await Brand.find({ status: true });
  if (!brands) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch brands" });
  }

  res
    .status(200)
    .json({ success: true, page, totalPages, products, brands, categories });
});

// desc => data for add product form in admin
// GET /api/admin/get-product-data-for-addproduct
export const get_product_data_for_product_crud = AsyncHandler(
  async (req, res) => {
    const categories = await Category.find({ status: true });
    if (!categories) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch categories" });
    }

    const brands = await Brand.find({ status: true });
    if (!brands) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch brands" });
    }
    res.status(200).json({ success: true, brands, categories });
  }
);

// desc => for users home page
// GET /api/users/products
export const get_all_products_details = AsyncHandler(async (req, res) => {
  const products_data = await Product.find({ is_active: true })
    .populate("offer")
    .populate("category")
    .populate("brand");

  const products = products_data.filter((product) => product.category.status);

  const categories = await Category.find({ status: true });
  if (!categories) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch categories" });
  }

  const brands = await Brand.find({ status: true });
  if (!brands) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch brands" });
  }

  if (!products.length) {
    return res.status(200).json({
      success: true,
      message: "No products found",
      products,
      brands,
      categories,
    });
  }

  res.status(200).json({ success: true, products, brands, categories });
});

// GET /api/users/get_product/:id
// GET /api/admin/products/:id
export const get_product = AsyncHandler(async (req, res) => {
  const productId = req.params.productId;

  const product = await Product.findOne({ _id: productId })
    .populate("offer")
    .populate("category")
    .populate("brand");

  const categories = await Category.find({ status: true });
  if (!categories) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch categories" });
  }

  const brands = await Brand.find({ status: true });
  if (!brands) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch brands" });
  }

  if (product) {
    return res.status(200).json({
      success: true,
      message: "No products found",
      product,
      brands,
      categories,
    });
  }
});

// POST /api/admin/products
export const add_new_product = AsyncHandler(async (req, res) => {
  const {
    name,
    brand,
    description,
    category,
    price,
    discount,
    specifications,
    tags,
    releaseDate,
    isFeatured,
    variants,
  } = req.body;

  const imagesByVariant = {};

  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      const variantId = file.fieldname.split("[")[1].split("]")[0];
      if (!imagesByVariant[variantId]) {
        imagesByVariant[variantId] = [];
      }
      imagesByVariant[variantId].push(file.filename);
    });
  }

  const brand_data = await Brand.findOne({ name: brand });
  if (!brand_data) {
    return res.status(400).json({ success: false, message: "Brand not found" });
  }

  const category_data = await Category.findOne({ title: category });
  if (!category_data) {
    return res
      .status(400)
      .json({ success: false, message: "Category not found" });
  }

  const is_category_offer_exists = await Offer.findOne({
    target_id: category_data._id,
  });

  const offer = is_category_offer_exists ? is_category_offer_exists._id : null;

  const newProduct = new Product({
    name,
    brand: brand_data._id,
    description,
    category: category_data._id,
    price: Number(price),
    discount: Number(discount),
    specifications,
    tags: tags.split(",").map((tag) => tag.trim()),
    releaseDate,
    isFeatured,
    variants: variants.map((variant, index) => ({
      color: variant.color,
      ram: variant.ram,
      storage: variant.storage,
      price: Number(variant.price),
      stock: Number(variant.stock),
      sku: variant.sku,
      images: imagesByVariant[index] || [],
    })),
    offer: offer,
  });

  const savedProduct = await newProduct.save();

  res.status(201).json({
    success: true,
    message: "Product added successfully",
    product: savedProduct,
  });
});

// PUT /api/admin/products/:producId
export const update_product_details = AsyncHandler(async (req, res) => {
  const productId = req.params.productId;

  const {
    name,
    brand,
    description,
    category,
    price,
    discount,
    specifications,
    tags,
    releaseDate,
    isFeatured,
    variants,
  } = req.body.data;

  const imagesByVariant = {};

  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      const variantId = file.fieldname.split("[")[2].split("]")[0];
      if (!imagesByVariant[variantId]) {
        imagesByVariant[variantId] = [];
      }
      imagesByVariant[variantId].push(file.path.split("/").pop());
    });
  }

  const product_to_update = await Product.findById(productId);
  if (!product_to_update) {
    return res
      .status(400)
      .json({ success: false, message: "Product not found" });
  }

  const brand_data = await Brand.findOne({ name: brand });
  if (!brand_data) {
    return res.status(400).json({ success: false, message: "Brand not found" });
  }

  const category_data = await Category.findOne({ title: category });
  if (!category_data) {
    return res
      .status(400)
      .json({ success: false, message: "Category not found" });
  }

  let is_updated = false;

  if (product_to_update.name !== name) {
    product_to_update.name = name;
    is_updated = true;
  }

  if (product_to_update.brand !== brand_data._id) {
    product_to_update.brand = brand_data._id;
    is_updated = brand_data._id;
  }

  if (product_to_update.description !== description) {
    product_to_update.description = description;
    is_updated = true;
  }

  if (product_to_update.category !== category_data._id) {
    const is_category_offer_exists = await Offer.findOne({
      target_id: category_data._id,
    });

    const offer = is_category_offer_exists
      ? is_category_offer_exists._id
      : null;
    product_to_update.offer = offer;
    product_to_update.category = category_data._id;
    is_updated = true;
  }

  if (product_to_update.price !== Number(price)) {
    product_to_update.price = Number(price);
    is_updated = true;
  }

  if (product_to_update.discount !== Number(discount)) {
    product_to_update.discount = Number(discount);
    is_updated = true;
  }

  product_to_update.specifications = specifications;
  product_to_update.tags = tags.split(",").map((tag) => tag.trim());
  product_to_update.releaseDate = releaseDate;
  if (product_to_update.isFeatured !== isFeatured) {
    product_to_update.isFeatured = isFeatured;
  }

  product_to_update.variants = product_to_update.variants = variants.map(
    (variant, index) => {
      let existingImages = (variant.images || []).map((img) => {
        const urlParts = img.preview.split("/");
        return urlParts[urlParts.length - 1];
      });

      existingImages = existingImages.filter(
        (img) => img.startsWith("v") || img.startsWith("data")
      );

      const newImagesForVariant = imagesByVariant[index] || [];

      return {
        color: variant.color,
        ram: variant.ram,
        storage: variant.storage,
        price: Number(variant.price),
        stock: Number(variant.stock),
        sku: variant.sku,
        images: [...existingImages, ...newImagesForVariant],
      };
    }
  );

  await product_to_update.save();

  res.status(200).json({ success: true, product_to_update, brand, category });
});

// PATCH /api/admin/products/:productId
export const update_product_status = AsyncHandler(async (req, res) => {
  const productId = req.params.productId;

  const product_to_update = await Product.findById(productId);
  if (!product_to_update) {
    return res
      .status(400)
      .json({ success: false, message: "Product not found" });
  }

  product_to_update.is_active = !product_to_update.is_active;
  await product_to_update.save();

  res.status(200).json({ success: true, product_to_update });
});

export const variant_details_of_product = AsyncHandler(async (req, res) => {
  const { productId, variant } = req.query;

  if (!productId || !variant) {
    return res.status(400).json({
      success: false,
      message: "Product ID and variant are required.",
    });
  }

  const product = await Product.findById(productId)
    .populate("offer")
    .populate("brand")
    .populate("category")
    .exec();

  if (!product) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
  }

  const selectedVariant = product.variants.find((v) => v.sku === variant);

  if (!selectedVariant) {
    return res
      .status(404)
      .json({ success: false, message: "Variant not found." });
  }

  const cartData = {
    items: [
      {
        product: {
          specifications: product.specifications,
          _id: product._id,
          name: product.name,
          brand: product.brand._id,
          is_active: product.is_active,
          description: product.description,
          category: product.category._id,
          price: product.price,
          discount: product.discount,
          variants: [selectedVariant],
          tags: product.tags,
          releaseDate: product.releaseDate,
          isFeatured: product.isFeatured,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          reviews: product.reviews,
          offer: product.offer,
        },
        variant: selectedVariant.sku,
        quantity: 1,
        price: selectedVariant.price,
        discount: product.discount,
        totalPrice:
          selectedVariant.price -
          selectedVariant.price *
            ((product.discount +
              (product.offer?.offer_value ? product.offer?.offer_value : 0)) /
              100),
        _id: selectedVariant._id,
      },
    ],
    totalAmount:
      selectedVariant.price -
      selectedVariant.price *
        ((product.discount +
          (product.offer?.offer_value ? product.offer?.offer_value : 0)) /
          100),
  };

  res.status(200).json({
    success: true,
    cart_data: cartData,
  });
});

// @desc getting product data for offers
// GET /api/admin/products/products-data
export const get_products_for_offers = AsyncHandler(async (req, res) => {
  const { searchTerm } = req.query;

  const products = await Product.find(
    { name: { $regex: new RegExp(searchTerm, "i") }, is_active: true },
    { name: true }
  );

  res.status(200).json(products);
});
