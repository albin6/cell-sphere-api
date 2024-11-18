import express from "express";
import { authenticate_token } from "../middleware/authenticate_token.js";
import {
  admin_login,
  admin_logout,
  create_admin,
  new_access_token_generate,
  get_users_list,
  update_user_status,
} from "../controllers/admin_controller.js";
import {
  get_all_categories,
  add_new_category,
  update_category,
  update_category_status,
  get_all_categories_for_offers,
} from "../controllers/category_controller.js";
import {
  add_new_brand,
  get_all_brands,
  update_brand_status,
  update_brand,
} from "../controllers/brand_controller.js";
import {
  add_new_product,
  get_product,
  get_product_data_for_product_crud,
  get_products_details,
  get_products_for_offers,
  update_product_details,
  update_product_status,
} from "../controllers/products_controller.js";
import { upload, upload_prodcuct } from "../utils/multer/multer.js";
import {
  add_new_coupon,
  delete_coupon,
  get_coupons,
  update_coupon_status,
} from "../controllers/coupon_controller.js";
import {
  cancel_order,
  get_all_orders,
  response_to_return_request,
  update_order_status,
} from "../controllers/order_controller.js";
import {
  add_new_offer,
  delete_offer,
  get_all_offers,
} from "../controllers/offer_controller.js";
import { check_role } from "../middleware/RBAC/check_role.js";
import {
  download_sales_report_pdf,
  download_sales_report_xl,
  get_sales_report,
} from "../controllers/sales_controller.js";
import {
  get_chart_data,
  get_dashboard_data,
} from "../controllers/chart_controller.js";
import {
  add_new_banner,
  delete_banner,
  get_banners,
  update_banner_status,
} from "../controllers/banner_controller.js";
import { get_best_selling } from "../controllers/best_selling_controller.js";
const admin_router = express.Router();

// admin login / logout
admin_router.post("/login", admin_login);
admin_router.post("/logout", admin_logout);
// -------------------------------------------------------

// users
admin_router
  .route("/users-list")
  .get(authenticate_token, check_role(["admin"]), get_users_list)
  .patch(authenticate_token, check_role(["admin"]), update_user_status);
// -------------------------------------------------------

// categories
admin_router
  .route("/categories")
  .get(authenticate_token, check_role(["admin"]), get_all_categories)
  .post(authenticate_token, check_role(["admin"]), add_new_category)
  .put(authenticate_token, check_role(["admin"]), update_category)
  .patch(authenticate_token, check_role(["admin"]), update_category_status);

admin_router.get(
  "/categories-data",
  authenticate_token,
  check_role(["admin"]),
  get_all_categories_for_offers
);
// -------------------------------------------------------

admin_router
  .route("/brands")
  .get(authenticate_token, check_role(["admin"]), get_all_brands)
  .post(authenticate_token, check_role(["admin"]), upload, add_new_brand)
  .patch(authenticate_token, check_role(["admin"]), update_brand_status)
  .put(authenticate_token, check_role(["admin"]), upload, update_brand);
// -------------------------------------------------------

admin_router
  .route("/products")
  .get(authenticate_token, check_role(["admin"]), get_products_details)
  .post(
    authenticate_token,
    check_role(["admin"]),
    upload_prodcuct,
    add_new_product
  );

admin_router.get(
  "/products-data-for-product_crud",
  authenticate_token,
  check_role(["admin"]),
  get_product_data_for_product_crud
);

// -------------------------------------------------------

admin_router
  .route("/products/:productId")
  .get(authenticate_token, check_role(["admin"]), get_product)
  .put(
    authenticate_token,
    check_role(["admin"]),
    upload_prodcuct,
    update_product_details
  )
  .patch(authenticate_token, check_role(["admin"]), update_product_status);

admin_router.get(
  "/products-data",
  authenticate_token,
  check_role(["admin"]),
  get_products_for_offers
);

// -------------------------------------------------------

admin_router
  .route("/coupons")
  .get(authenticate_token, check_role(["admin"]), get_coupons)
  .post(authenticate_token, check_role(["admin"]), add_new_coupon)
  .patch(authenticate_token, check_role(["admin"]), update_coupon_status)
  .delete(authenticate_token, check_role(["admin"]), delete_coupon);

// -------------------------------------------------------

admin_router.get(
  "/orders",
  authenticate_token,
  check_role(["admin"]),
  get_all_orders
);

admin_router.patch(
  "/orders/:orderId/status",
  authenticate_token,
  check_role(["admin"]),
  update_order_status
);

admin_router.patch(
  "/orders/:orderId/cancel",
  authenticate_token,
  check_role(["admin"]),
  cancel_order
);

admin_router.patch(
  "/order/:orderId/response",
  authenticate_token,
  check_role(["admin"]),
  response_to_return_request
);

// -------------------------------------------------------

admin_router
  .route("/offers")
  .get(authenticate_token, check_role(["admin"]), get_all_offers)
  .post(authenticate_token, check_role(["admin"]), add_new_offer)
  .delete(authenticate_token, check_role(["admin"]), delete_offer);

// ==============================================================================

admin_router.get(
  "/sales-report",
  authenticate_token,
  check_role(["admin"]),
  get_sales_report
);

admin_router.get(
  "/download-report/pdf",
  authenticate_token,
  check_role(["admin"]),
  download_sales_report_pdf
);

admin_router.get(
  "/download-report/excel",
  authenticate_token,
  check_role(["admin"]),
  download_sales_report_xl
);
// ==============================================================================

admin_router.get(
  "/dashboard-data",
  authenticate_token,
  check_role(["admin"]),
  get_dashboard_data
);

// ==============================================================================

admin_router
  .route("/banner")
  .get(authenticate_token, check_role(["admin"]), get_banners)
  .post(authenticate_token, check_role(["admin"]), add_new_banner)
  .delete(authenticate_token, check_role(["admin"]), delete_banner)
  .patch(authenticate_token, check_role(["admin"]), update_banner_status);

// ==============================================================================

admin_router.get(
  "/best-selling",
  authenticate_token,
  check_role(["admin"]),
  get_best_selling
);

admin_router.get(
  "/chart-data",
  authenticate_token,
  check_role(["admin"]),
  get_chart_data
);

// ==============================================================================

// -------------------------------------------------------
// -------------------------------------------------------
// create admin
admin_router.post("/create", create_admin);
// generate new access token
admin_router.post("/token", new_access_token_generate);

export default admin_router;
