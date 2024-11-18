import AsyncHandler from "express-async-handler";
import Wallet from "../models/walletModel.js";

// for getting wallet details of a user
export const get_wallet_details = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;

  let user_wallet = await Wallet.findOne({ user: user_id });
  if (!user_wallet) {
    user_wallet = new Wallet({ user: user_id, balance: 0 });
  }

  res.json({ success: true, wallet: user_wallet });
});

// for updating wallet balance
export const update_wallet_balance = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { amount, payment_status } = req.body;

  let user_wallet = await Wallet.findOne({ user: user_id });

  if (!user_wallet) {
    user_wallet = new Wallet({
      user: user_id,
      balance: 0,
    });
  }

  if (payment_status !== "failed") {
    user_wallet.balance += amount;
  }

  const transaction = {
    transaction_date: new Date(),
    transaction_type: "credit",
    transaction_status: payment_status,
    amount: amount,
  };

  user_wallet.transactions.push(transaction);

  await user_wallet.save();

  res.json({ success: true, wallet: user_wallet });
});
