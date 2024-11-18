import AsyncHandler from "express-async-handler";
import Cart from "../models/cartModel.js";
import mongoose from "mongoose";

// ----------------------------------------------------------------------------
// for getting cart products
// ----------------------------------------------------------------------------
export const get_cart_products = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;

  const cart_data = await Cart.findOne({ user: user_id }).populate({
    path: "items.product",
    populate: [
      {
        path: "offer",
      },
      {
        path: "category",
      },
    ],
  });

  if (cart_data && cart_data.items) {
    cart_data.items = cart_data.items.filter(
      (item) =>
        item.product && item.product.is_active && item.product.category.status
    );
  }

  if (cart_data && cart_data.items) {
    cart_data.items = cart_data.items.map((item) => {
      return {
        ...item,
        discount:
          item.discount +
          (item.product?.offer?.offer_value
            ? item.product?.offer?.offer_value
            : 0),
        totalPrice:
          item.quantity *
          (item.price -
            (item.price *
              (item.discount +
                (item.product?.offer?.offer_value
                  ? item.product?.offer?.offer_value
                  : 0))) /
              100),
      };
    });
  }

  if (!cart_data) {
    const cart_data = await Cart.create({ user: user_id });
    return res.status(200).json({ success: true, cart_data });
  }

  res.status(200).json({ success: true, cart_data });
});

// ----------------------------------------------------------------------------
// for adding products to cart
// ----------------------------------------------------------------------------
export const add_product_to_cart = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { sku, price } = req.body.selectedVariant;
  const { discount } = req.body.product;
  const quantity = 1;

  const cartItem = {
    product: req.body.product._id,
    variant: sku,
    quantity,
    price,
    discount: discount,
    totalPrice: quantity * price,
  };

  let cart = await Cart.findOne({ user: user_id });

  if (!cart) {
    cart = new Cart({
      user: user_id,
      items: [cartItem],
    });
  } else {
    const productExists = cart.items.some(
      (item) =>
        item.product.toString() === req.body.product._id && item.variant === sku
    );

    if (productExists) {
      return res
        .status(400)
        .json({ success: false, message: "Product already in Cart" });
    }
    cart.items.push(cartItem);
  }

  await cart.save();

  res.json({ success: true, cart });
});

// ----------------------------------------------------------------------------
// for checking the product variant exists in the cart
// ----------------------------------------------------------------------------
export const check_product_variant_in_cart = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { product_id, variant_sku } = req.query;

  const cart_data = await Cart.findOne({ user: user_id });
  if (!cart_data) {
    return res.status(404).json({ success: false, message: "Cart not found" });
  }

  const productObjectId = new mongoose.Types.ObjectId(product_id);

  const cart_item = cart_data.items.find(
    (item) =>
      item.product.equals(productObjectId) && item.variant === variant_sku
  );

  if (!cart_item) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found in cart" });
  }

  res.json({ success: true, cart: cart_item });
});

// ----------------------------------------------------------------------------
// for updating the quantity of product in the cart
// ----------------------------------------------------------------------------
export const update_product_quantity = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const product_sku = req.params.productSKU;
  const quantity = req.body.quantity;

  const cart_data = await Cart.findOne({ user: user_id });

  cart_data.items.map((item) =>
    item.variant === product_sku ? (item.quantity = quantity) : item.quantity
  );

  await cart_data.save();

  res.json({ success: true, cart_data });
});

// ----------------------------------------------------------------------------
// for deleting a product from the cart
// ----------------------------------------------------------------------------
export const delete_product = AsyncHandler(async (req, res) => {
  const product_sku = req.params.productSKU;

  const cart_data = await Cart.findOneAndUpdate(
    { user: req.user.id },
    { $pull: { items: { variant: product_sku } } },
    { new: true }
  );

  const cart = await Cart.findOne({ user: req.user.id });
  if (cart) {
    cart.totalAmount = cart.items.reduce((acc, item) => {
      return acc + item.totalPrice;
    }, 0);

    await cart.save();
  }

  res.json({ success: true, cart_data });
});
