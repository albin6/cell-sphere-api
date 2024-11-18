import AsyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Wallet from "../models/walletModel.js";

export const verify_referral_code = AsyncHandler(async (req, res) => {
  const { code } = req.body;

  const user_with_referral_code = await User.findOne({ referral_code: code });

  if (!user_with_referral_code) {
    return res.status(404).json({
      success: false,
      message: "Code is invalid. There is no user exists with this code.",
    });
  }

  let current_user_wallet = await Wallet.findOne({ user: req.user.id });

  if (!current_user_wallet) {
    current_user_wallet = new Wallet({ user: req.user.id, balance: 0 });
  }

  current_user_wallet.balance = 2000;

  const transaction = {
    transaction_date: new Date(),
    transaction_type: "credit",
    transaction_status: "completed",
    amount: 2000,
  };

  current_user_wallet.transactions.push(transaction);

  await current_user_wallet.save();

  let referred_user_wallet = await Wallet.findOne({
    user: user_with_referral_code._id,
  });

  if (!referred_user_wallet) {
    referred_user_wallet = new Wallet({
      user: user_with_referral_code._id,
      balance: 0,
    });
  }

  referred_user_wallet.balance += 2000;

  const referred_transaction = {
    transaction_date: new Date(),
    transaction_type: "credit",
    transaction_status: "completed",
    amount: 2000,
  };

  referred_user_wallet.transactions.push(referred_transaction);

  await referred_user_wallet.save();

  await User.findByIdAndUpdate(req.user.id, { has_seen: true }, { new: true });

  res.json({
    success: true,
    message: `Referral offer applied and RS 2000 credited to your wallet`,
  });
});

export const get_referral_details = AsyncHandler(async (req, res) => {
  const user_data = await User.findOne({ _id: req.user.id });

  if (!user_data) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.json({ has_seen: user_data.has_seen });
});

export const change_status = AsyncHandler(async (req, res) => {
  const user_data = await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: { has_seen: true },
    },
    { new: true }
  );

  res.json({ has_seen: user_data.has_seen });
});
