import express from "express";
import { authenticate_token } from "../middleware/authenticate_token.js";
import {
  register,
  login,
  send_otp,
  verify_otp,
  reset_password,
  logout,
  new_access_token_generate,
  reset_the_password,
  check_current_password,
  send_otp_for_forgot_password,
  get_user_specific_info,
} from "../controllers/user_controller.js";
import {
  get_all_products_details,
  get_product,
  variant_details_of_product,
} from "../controllers/products_controller.js";
import {
  get_category_product,
  get_listing_products_details,
  get_products_of_brand,
  get_products_of_category,
} from "../controllers/product_listing_controller.js";
import { get_all_categories } from "../controllers/category_controller.js";
import { get_all_brands } from "../controllers/brand_controller.js";
import {
  add_new_address,
  delete_address,
  get_all_addresses,
  update_address,
} from "../controllers/address_controller.js";
import {
  get_user_info,
  update_user_info,
} from "../controllers/profile_controller.js";
import {
  add_product_to_cart,
  check_product_variant_in_cart,
  delete_product,
  get_cart_products,
  update_product_quantity,
} from "../controllers/cart_controller.js";

import {
  add_product_to_wishlist,
  check_product_in_wishlist,
  get_wishlist_products,
  remove_product_from_wishlist,
} from "../controllers/wishlist_controller.js";
import {
  cancel_order,
  get_specific_order_details,
  get_user_specific_orders,
  place_order,
  request_for_return,
} from "../controllers/order_controller.js";
import {
  get_wallet_details,
  update_wallet_balance,
} from "../controllers/wallet_controller.js";
import {
  apply_coupon,
  get_coupons_user,
} from "../controllers/coupon_controller.js";
import { check_role } from "../middleware/RBAC/check_role.js";
import { get_all_active_banners } from "../controllers/banner_controller.js";
import { handle_chat } from "../services/gemini_ai.js";
import {
  change_status,
  get_referral_details,
  verify_referral_code,
} from "../controllers/referral_controller.js";
import { generate_order_invoice } from "../controllers/sales_controller.js";
import { re_payment } from "../models/payment_controller.js";
import {
  add_new_review_and_rating,
  get_all_reviews_and_ratings,
} from "../controllers/review_controller.js";
const user_router = express.Router();

user_router.post("/signup", register);
user_router.post("/login", login);
user_router.post("/send-otp", send_otp);
user_router.post("/send-otp-forgotpassword", send_otp_for_forgot_password);
user_router.post("/verify-otp", verify_otp);
user_router.post("/reset-password", reset_password);
user_router.post("/logout", logout);
user_router.get("/get-products-details", get_all_products_details);
user_router.get("/banner", get_all_active_banners);

// ----------------------------------------------------

user_router
  .route("/referral")
  .get(authenticate_token, check_role(["user"]), get_referral_details)
  .patch(authenticate_token, check_role(["user"]), change_status);

user_router.post(
  "/verify-referral",
  authenticate_token,
  check_role(["user"]),
  verify_referral_code
);

// ----------------------------------------------------
user_router.get(
  "/get-product/:productId",
  authenticate_token,
  check_role(["user"]),
  get_product
);

// ----------------------------------------------------
// ----------------------------------------------------
user_router.get(
  "/get-products-of-category/:categoryId",
  authenticate_token,
  check_role(["user"]),
  get_products_of_category
);
user_router.get(
  "/get-products-of-brand/:brandId",
  authenticate_token,
  check_role(["user"]),
  get_products_of_brand
);
user_router.get(
  "/get-listing-products",
  authenticate_token,
  check_role(["user"]),
  get_listing_products_details
);

user_router.get(
  "/get-category-products",
  authenticate_token,
  check_role(["user"]),
  get_category_product
);

// ----------------------------------------------------
// ----------------------------------------------------

user_router
  .route("/reviews")
  .get(authenticate_token, check_role(["user"]), get_all_reviews_and_ratings)
  .post(authenticate_token, check_role(["user"]), add_new_review_and_rating);

// ----------------------------------------------------
// ----------------------------------------------------
user_router.get(
  "/get-all-categories",
  authenticate_token,
  check_role(["user"]),
  get_all_categories
);
user_router.get(
  "/get-all-brands",
  authenticate_token,
  check_role(["user"]),
  get_all_brands
);

// ----------------------------------------------------
// ----------------------------------------------------

user_router.get(
  "/address",
  authenticate_token,
  check_role(["user"]),
  get_all_addresses
);
user_router.post(
  "/address",
  authenticate_token,
  check_role(["user"]),
  add_new_address
);
user_router
  .route("/address/:addressId")
  .put(authenticate_token, check_role(["user"]), update_address)
  .delete(authenticate_token, check_role(["user"]), delete_address);

// ----------------------------------------------------
// ----------------------------------------------------

user_router
  .route("/profile")
  .get(authenticate_token, check_role(["user"]), get_user_info)
  .put(authenticate_token, check_role(["user"]), update_user_info);

user_router.post(
  "/check-current-password",
  authenticate_token,
  check_role(["user"]),
  check_current_password
);

user_router.post(
  "/reset-the-password",
  authenticate_token,
  check_role(["user"]),
  reset_the_password
);

// ----------------------------------------------------
// ----------------------------------------------------

user_router.get(
  "/cart-data",
  authenticate_token,
  check_role(["user"]),
  check_product_variant_in_cart
);

user_router
  .route("/cart")
  .get(authenticate_token, check_role(["user"]), get_cart_products)
  .post(authenticate_token, check_role(["user"]), add_product_to_cart);

user_router
  .route("/cart/:productSKU")
  .patch(authenticate_token, check_role(["user"]), update_product_quantity)
  .delete(authenticate_token, check_role(["user"]), delete_product);

// ----------------------------------------------------
// ----------------------------------------------------

user_router
  .route("/wishlists")
  .get(authenticate_token, check_role(["user"]), get_wishlist_products)
  .post(authenticate_token, check_role(["user"]), add_product_to_wishlist)
  .delete(
    authenticate_token,
    check_role(["user"]),
    remove_product_from_wishlist
  );

user_router.get(
  "/wishlists/product-existence",
  authenticate_token,
  check_role(["user"]),
  check_product_in_wishlist
);

// ----------------------------------------------------
// ----------------------------------------------------

user_router
  .route("/coupons")
  .post(authenticate_token, check_role(["user"]), apply_coupon)
  .get(authenticate_token, check_role(["user"]), get_coupons_user);

user_router.get(
  "/get-variant-details-of-product",
  authenticate_token,
  check_role(["user"]),
  variant_details_of_product
);

user_router.post(
  "/place-order",
  authenticate_token,
  check_role(["user"]),
  place_order
);

user_router.get(
  "/orders",
  authenticate_token,
  check_role(["user"]),
  get_user_specific_orders
);

user_router
  .route("/orders/:orderId")
  .get(authenticate_token, check_role(["user"]), get_specific_order_details)
  .patch(authenticate_token, check_role(["user"]), cancel_order);

// re payment

user_router.put(
  "/re-payment",
  authenticate_token,
  check_role(["user"]),
  re_payment
);

// ---------------------------------------------------
// ---------------------------------------------------

user_router.get(
  "/orders/:orderId/invoice",
  authenticate_token,
  check_role(["user"]),
  generate_order_invoice
);

// ---------------------------------------------------
// ---------------------------------------------------

user_router
  .route("/wallet")
  .get(authenticate_token, check_role(["user"]), get_wallet_details)
  .put(authenticate_token, check_role(["user"]), update_wallet_balance);

// ----------------------------------------------------
// ----------------------------------------------------

user_router.get(
  "/get-user-info",
  authenticate_token,
  check_role(["user"]),
  get_user_specific_info
);

// ----------------------------------------------------
// ----------------------------------------------------

// order return
user_router.patch(
  "/order/:orderId/return",
  authenticate_token,
  check_role(["user"]),
  request_for_return
);

// ----------------------------------------------------
// ----------------------------------------------------

user_router.post("/chat", handle_chat);

// ----------------------------------------------------
// ----------------------------------------------------

user_router.post("/token", new_access_token_generate);

export default user_router;
