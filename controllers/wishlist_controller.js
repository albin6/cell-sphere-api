import AsyncHandler from "express-async-handler";
import Wishlist from "../models/wishlistModel.js";

// for getting all wishlist items
export const get_wishlist_products = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const wishlist_items = await Wishlist.find({ user: user_id }).populate({
    path: "items.product",
    match: { is_active: true },
  });

  if (!wishlist_items) {
    return res.status(404).json({ success: false });
  }

  res.json({ success: true, wishlists: wishlist_items });
});

// for adding a product to wishlist
export const add_product_to_wishlist = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { productId, variant } = req.body;
  const sku = variant;

  let wishlist = await Wishlist.findOne({ user: user_id });

  const wishlist_data = {
    product: productId,
    variant: sku,
  };

  if (!wishlist) {
    wishlist = new Wishlist({
      user: user_id,
      items: [wishlist_data],
    });
  } else {
    const productExists = wishlist.items.some(
      (item) => item.product.toString() === productId && item.variant === sku
    );

    if (productExists) {
      return res
        .status(400)
        .json({ success: false, message: "Product already in wishlist" });
    }

    wishlist.items.push(wishlist_data);
  }

  await wishlist.save();

  res.status(201).json({ success: true, wishlist });
});

// for removing products from wishlist
export const remove_product_from_wishlist = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { productId, variant } = req.body;

  const wishlist = await Wishlist.findOne({ user: user_id });

  if (!wishlist) {
    return res
      .status(404)
      .json({ success: false, message: "Wishlist not found" });
  }

  const initialItemCount = wishlist.items.length;
  wishlist.items = wishlist.items.filter(
    (item) => item.product.toString() !== productId || item.variant !== variant
  );

  if (wishlist.items.length === initialItemCount) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found in wishlist" });
  }

  await wishlist.save();

  res.json({ success: true, message: "Product removed from wishlist" });
});

// for getting product is available in the wishlist
export const check_product_in_wishlist = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { productId, variant } = req.query;

  const wishlist_item = await Wishlist.findOne({
    user: user_id,
    "items.product": productId,
    "items.variant": variant,
  });

  if (!wishlist_item) {
    return res.json({
      success: false,
      isInWishlist: false,
      message: "Product not found in wishlist",
    });
  }

  res.json({ success: true, isInWishlist: true });
});
