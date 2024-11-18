import AsyncHandler from "express-async-handler";
import User from "../models/userModel.js";

// for getting user information
export const get_user_info = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;

  const user_data = await User.findById(user_id);

  res.status(200).json({ success: true, user_data });
});

// for updating user information
export const update_user_info = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const user_data = req.body;

  const user = await User.findById(user_id);

  user.first_name = user_data.first_name || user.first_name;
  user.last_name = user_data.last_name || user.last_name;
  user.phone_number = user_data.phone_number || user.phone_number;
  user.email = user_data.email || user.email;

  await user.save();

  res.json({ success: true, user });
});
