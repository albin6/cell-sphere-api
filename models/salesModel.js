import mongoose from "mongoose";

const sales_report_schema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  product: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productName: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      unitPrice: {
        type: Number,
        required: true,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      discount: {
        type: Number,
        default: 0,
      },
      couponDeduction: {
        type: Number,
        default: 0,
      },
    },
  ],

  finalAmount: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  customer_name: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["Razorpay", "Wallet", "UPI", "Cash on Delivery", "Paypal"],
    required: true,
  },
  deliveryStatus: {
    type: String,
    enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
    required: true,
  },
});

const SalesReport = mongoose.model("sales-report", sales_report_schema);

export default SalesReport;
