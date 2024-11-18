import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      variant: {
        type: String,
      },
      quantity: {
        type: Number,
        min: [1, "Quantity must be at least 1"],
        default: 1,
      },
      price: {
        type: Number,
        default: 0,
        min: [0, "Price cannot be negative"],
      },
      discount: {
        type: Number,
        min: [0, "Discount cannot be negative"],
        max: [100, "Discount cannot exceed 100%"],
      },
      totalPrice: {
        type: Number,
        default: 0,
      },
    },
  ],
  totalAmount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

cartSchema.pre("save", function (next) {
  // Calculate totalAmount based on all items in the cart.
  this.totalAmount = this.items.reduce((acc, item) => {
    return acc + item.totalPrice;
  }, 0);

  this.updatedAt = Date.now();
  next();
});

cartSchema.index({ user: 1 });

const Cart = mongoose.model("cart", cartSchema);

export default Cart;
