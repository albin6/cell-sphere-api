import AsyncHandler from "express-async-handler";
import Order from "./orderModel.js";

// Failed payment repayment
// PUT /api/users/re-payment
export const re_payment = AsyncHandler(async (req, res) => {
  const { payment_status, orderId } = req.body;

  const updated_order_payment = await Order.findByIdAndUpdate(
    orderId,
    {
      $set: { payment_status: payment_status },
    },
    { new: true }
  );

  if (!updated_order_payment) {
    return res
      .status(400)
      .json({ success: false, message: "Error while updating status" });
  }

  res.json({ success: true, message: "Order Payment Completed Successfully" });
});
