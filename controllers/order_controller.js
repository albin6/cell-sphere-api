import AsyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import { format_date } from "../utils/date-formatter/format-date.js";
import { return_eligible_date } from "../utils/date-formatter/return-eligible-date.js";
import Product from "../models/productModel.js";
import Cart from "../models/cartModel.js";
import Wallet from "../models/walletModel.js";
import SalesReport from "../models/salesModel.js";
import Coupon from "../models/couponModel.js";

const createSalesReport = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("user")
    .populate("order_items.product");

  if (!order) {
    return;
  }

  const products = order.order_items.map((item) => {
    const itemTotalPrice = item.price * item.quantity;
    const discountAmount = (item.discount / 100) * itemTotalPrice;

    return {
      product_id: item.product._id,
      productName: item.product.name || "Product Name",
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: itemTotalPrice,
      discount: discountAmount,
      couponDeduction: order.coupon_discount || 0,
    };
  });

  const finalAmount =
    order.total_price_with_discount ||
    order.total_amount - order.coupon_discount;

  const reportEntry = {
    orderId: order._id,
    customer_name: order.user.first_name + " " + order.user.last_name,
    product: products,
    finalAmount: finalAmount,
    orderDate: order.placed_at,
    customer: order.user._id,
    paymentMethod: order.payment_method,
    deliveryStatus: order.order_items[0].order_status,
  };

  await SalesReport.create(reportEntry);
};

// =============================================================================
// user side
// =============================================================================

// for placing an order
export const place_order = AsyncHandler(async (req, res) => {
  const { order_data, is_coupon_applied, code } = req.body;

  let is_any_product_is_stockout = false;

  for (const item of order_data.order_items) {
    const { product, variant, quantity } = item;

    const product_data = await Product.findById(product);

    if (product_data) {
      const variant_data = product_data.variants.find((v) => v.sku === variant);

      if (variant_data && variant_data.stock < quantity) {
        is_any_product_is_stockout = true;
        return res.status(400).json({
          success: false,
          message: `Not enough stock for variant: ${variant}`,
        });
      }
    }
  }

  if (!is_any_product_is_stockout) {
    if (is_coupon_applied) {
      const coupon = await Coupon.findOne({ code });

      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }

      const appliedUser = coupon.users_applied.find(
        (entry) => entry.user.toString() === req.user.id
      );

      if (appliedUser) {
        await Coupon.updateOne(
          { code, "users_applied.user": req.user.id },
          { $inc: { "users_applied.$.used_count": 1 } }
        );
      } else {
        await Coupon.updateOne(
          { code },
          {
            $push: {
              users_applied: {
                user: req.user.id,
                used_count: 1,
              },
            },
          }
        );
      }
    }

    const new_order = new Order({ ...order_data, user: req.user.id });

    if (new_order) {
      for (const item of order_data.order_items) {
        const { product, variant, quantity } = item;

        await Product.findByIdAndUpdate(
          product,
          { $inc: { quantity_sold: quantity } },
          { new: true, runValidators: true }
        );

        const product_data = await Product.findById(product);

        if (product_data) {
          const variant_data = product_data.variants.find(
            (v) => v.sku === variant
          );

          if (variant_data && variant_data.stock >= quantity) {
            variant_data.stock -= quantity;
          } else {
            return res.status(400).json({
              success: false,
              message: `Not enough stock for variant: ${variant}`,
            });
          }

          await product_data.save();
        }
      }
      await Cart.updateOne(
        { user: req.user.id },
        {
          $pull: {
            items: {
              product: {
                $in: order_data.order_items.map((item) => item.product),
              },
            },
          },
        }
      );
    }

    if (order_data.payment_method === "Wallet") {
      let wallet_exists = await Wallet.findOne({ user: req.user.id });

      if (wallet_exists) {
        if (!(wallet_exists.balance >= new_order.total_price_with_discount)) {
          return res.status(400).json({
            message: "Insufficient balance in your wallet",
          });
        }
        wallet_exists.balance -= new_order.total_price_with_discount;

        const transaction = {
          order_id: new_order._id,
          transaction_date: new Date(),
          transaction_type: "debit",
          transaction_status: "completed",
          amount: new_order.total_price_with_discount * -1,
        };

        wallet_exists.transactions.push(transaction);

        await wallet_exists.save();
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient balance in your wallet. Please add balance first.",
        });
      }
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.totalAmount = cart.items.reduce((acc, item) => {
        return acc + item.totalPrice;
      }, 0);

      await cart.save();
    }

    await new_order.save();

    await createSalesReport(new_order._id);

    res.json({ success: true, order_id: new_order._id });
  }
});

// for getting user specific orders
export const get_user_specific_orders = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;

  const orders = await Order.find({ user: user_id })
    .populate("user")
    .populate("order_items.product")
    .sort({ placed_at: -1 });

  const order_data = orders.map((order) => {
    const eligibleReturnDate = return_eligible_date(order.placed_at);

    return {
      delivery_date: format_date(order.delivery_by),
      date: format_date(order.placed_at),
      total: order.total_price_with_discount,
      customerName: order.user.first_name + " " + order.user.last_name,
      orderItems: order.order_items.map((item) => {
        const product = item.product;
        const variant = product.variants.find((v) => v.sku === item.variant);

        return {
          productName: `${product.name} ( ${variant.ram}, ${variant.storage}, ${variant.color} )`,
          image: variant.images[0],
          price: item.total_price,
          id: item._id,
          status: item.order_status,
          sku: item.variant,
          return_eligible:
            Date.now() <= eligibleReturnDate
              ? "Eligible for return"
              : "Not eligible to return",
          return_request: item.return_request,
        };
      }),
      id: order._id,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
    };
  });

  res.json({ success: true, order_data });
});

// for getting specific order details of a customer
export const get_specific_order_details = AsyncHandler(async (req, res) => {
  const order_id = req.params.orderId;

  const order = await Order.findById(order_id)
    .populate("user")
    .populate({
      path: "order_items.product",
      populate: {
        path: "offer",
      },
    });

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  res.json({
    success: true,
    order_data: {
      deliveryBy: format_date(order.delivery_by),
      date: format_date(order.placed_at),
      total: order.total_price_with_discount,
      customerName: order.user.first_name + " " + order.user.last_name,
      orders: order,
    },
  });
});

// for cancelling and order
export const cancel_order = AsyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { sku } = req.body;

  if (!orderId || !sku) {
    return res.status(400).json({
      success: false,
      message: "Both Order ID and sku are required",
    });
  }

  // Find the order by ID
  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const orderItem = order.order_items.find((item) => item.variant == sku);

  if (!orderItem) {
    return res
      .status(404)
      .json({ success: false, message: "Order item not found" });
  }

  if (orderItem.order_status === "Cancelled") {
    return res.status(400).json({
      success: false,
      message: "Order item is already canceled",
    });
  }

  orderItem.order_status = "Cancelled";

  if (
    ["Wallet", "Paypal", "Razorpay"].includes(order.payment_method) &&
    order.payment_status == "Paid"
  ) {
    let user_wallet = await Wallet.findOne({ user: order.user });

    if (!user_wallet) {
      user_wallet = new Wallet({
        user: req.user.id,
        balance: 0,
        transactions: [],
      });
    }

    user_wallet.balance += orderItem.total_price;

    user_wallet.transactions.push({
      transaction_date: new Date(),
      transaction_type: "credit",
      transaction_status: "completed",
      amount: orderItem.total_price,
    });

    await user_wallet.save();
  }

  const { product, quantity } = orderItem;
  const productData = await Product.findById(product);

  if (productData) {
    const variantData = productData.variants.find((v) => v.sku === sku);
    const quantity_to_deduct = quantity * -1;
    await Product.findByIdAndUpdate(
      product,
      { $inc: { quantity_sold: quantity_to_deduct } },
      { new: true, runValidators: true }
    );
    if (variantData) {
      variantData.stock += quantity;
      await productData.save();
    }
  }

  await SalesReport.updateOne(
    { orderId: order._id, product: product },
    { deliveryStatus: "Cancelled" }
  );

  await order.save();

  res.json({ success: true, message: "Order item cancelled successfully" });
});

// =============================================================================
// admin side
// =============================================================================

// for getting all orders
export const get_all_orders = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const totalOrdersCount = await Order.countDocuments({});

  const orders = await Order.find({})
    .populate({
      path: "user",
      select: "first_name last_name",
    })
    .populate({
      path: "order_items.product",
      select: "name variants",
    })
    .sort({ placed_at: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalPages = Math.ceil(totalOrdersCount / limit);

  const formattedOrders = orders.map((order) => {
    return {
      user_full_name: `${order.user.first_name} ${order.user.last_name}`,
      order_items: order.order_items.map((item) => {
        const product = item.product;

        const variantDetails = product.variants.find(
          (variant) =>
            variant.sku === item.variant || variant.color === item.variant
        );

        return {
          product_name: product.name,
          sku: item.variant,
          variant: {
            color: variantDetails?.color || item.variant,
            ram: variantDetails?.ram || "N/A",
            storage: variantDetails?.storage || "N/A",
          },
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          total_price: item.total_price,
          order_status: item.order_status,
          return_request: {
            is_requested: item.return_request.is_requested,
            is_approved: item.return_request.is_approved,
            reason: item.return_request.reason || "",
            comment: item.return_request.comment || "",
            is_response_send: item.return_request?.is_response_send,
          },
        };
      }),
      _id: order._id,
      payment_status: order.payment_status,
      placed_at: order.placed_at,
    };
  });

  res.json({ success: true, totalPages, page, orders: formattedOrders });
});

// for updating order status
export const update_order_status = AsyncHandler(async (req, res) => {
  const order_id = req.params.orderId;
  const { status: new_status, sku } = req.body;

  const order = await Order.findById(order_id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.payment_status == "Failed" && new_status == "Delivered") {
    return res.status(400).json({
      success: false,
      message:
        "Cannot set the status to delivered without completing the payment",
    });
  }

  const item = order.order_items.find((orderItem) => orderItem.variant == sku);

  if (!item) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found in order" });
  }

  item.order_status = new_status;
  await SalesReport.updateOne(
    { orderId: order._id, product: item.product },
    { deliveryStatus: new_status }
  );
  if (new_status === "Cancelled") {
    const { product, variant, quantity, total_price } = item;

    const productData = await Product.findById(product);
    if (productData) {
      const variantData = productData.variants.find((v) => v.sku === variant);
      const quantity_to_deduct = quantity * -1;
      await Product.findByIdAndUpdate(
        product,
        { $inc: { quantity_sold: quantity_to_deduct } },
        { new: true, runValidators: true }
      );

      if (variantData) {
        variantData.stock += quantity;
        await productData.save();
      }
    }

    if (order.payment_method !== "Cash on Delivery") {
      let user_wallet = await Wallet.findOne({ user: order.user });
      if (!user_wallet) {
        user_wallet = new Wallet({
          user: req.user.id,
          balance: 0,
          transactions: [],
        });
      }

      user_wallet.balance += total_price;

      await SalesReport.updateOne(
        { orderId: order._id, product: item.product },
        { finalAmount: total_price }
      );

      user_wallet.transactions.push({
        transaction_date: new Date(),
        transaction_type: "credit",
        transaction_status: "completed",
        amount: total_price,
      });

      await user_wallet.save();
    }
  }

  await order.save();

  res.json({
    success: true,
    message: "Order status updated successfully",
    order,
  });
});

// ---------------------------------------------------------------------------------

export const request_for_return = AsyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const { productVariant, reason, comments } = req.body;

  const order_data = await Order.findOneAndUpdate(
    { _id: orderId, "order_items.variant": productVariant },
    {
      $set: {
        "order_items.$.return_request.is_requested": true,
        "order_items.$.return_request.reason": reason,
        "order_items.$.return_request.comment": comments,
      },
    },
    { new: true }
  );

  if (!order_data) {
    return res.status(404).json({ message: "Order or variant not found" });
  }

  res
    .status(200)
    .json({ message: "Return request updated successfully", order_data });
});

// for respond to return request ADMIN

export const response_to_return_request = AsyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const { isApproved, productVariant } = req.body;

  const order_data = await Order.findOneAndUpdate(
    { _id: orderId, "order_items.variant": productVariant },
    {
      $set: {
        "order_items.$.return_request.is_approved": isApproved,
        "order_items.$.return_request.is_response_send": true,
      },
    },
    { new: true }
  );

  if (isApproved) {
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const item = order.order_items.find(
      (orderItem) => orderItem.variant == productVariant
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in order" });
    }

    item.order_status = "Returned";
    await SalesReport.updateOne(
      { orderId: order._id, product: item.product },
      { deliveryStatus: "Returned" }
    );
    const { product, variant, quantity, total_price } = item;

    const productData = await Product.findById(product);
    if (productData) {
      const variantData = productData.variants.find((v) => v.sku === variant);
      if (variantData) {
        variantData.stock += quantity;
        await productData.save();
      }
    }

    await Wallet.findOneAndUpdate(
      { user: order.user },
      {
        $setOnInsert: {
          user: order.user,
          balance: 0,
          transactions: [],
        },
      },
      { upsert: true, new: true }
    );

    await Wallet.updateOne(
      { user: order.user },
      {
        $inc: { balance: total_price },
        $push: {
          transactions: {
            transaction_date: new Date(),
            transaction_type: "credit",
            transaction_status: "completed",
            amount: total_price,
          },
        },
      }
    );

    await order.save();

    if (productData) {
      const variantData = productData.variants.find(
        (v) => v.sku === productVariant
      );
      const quantity_to_deduct = quantity * -1;
      await Product.findByIdAndUpdate(
        product,
        { $inc: { quantity_sold: quantity_to_deduct } },
        { new: true, runValidators: true }
      );
      if (variantData) {
        variantData.stock += quantity;
        await productData.save();
      }
    }
  }

  if (!order_data) {
    return res.status(404).json({ message: "Order or variant not found" });
  }

  res
    .status(200)
    .json({ message: "Return request updated successfully", order_data });
});
