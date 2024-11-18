import AsyncHandler from "express-async-handler";
import Address from "../models/addressModel.js";

// for getting all addresses
export const get_all_addresses = AsyncHandler(async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "User  not authenticated" });
  }

  const user = req.user;
  const userId = user.id;

  const addresses_data = await Address.find({ user: userId });

  res.status(200).json({ success: true, addresses: addresses_data });
});

// for adding new address
export const add_new_address = AsyncHandler(async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "User not authenticated" });
  }

  const user = req.user;
  const userId = user.id;

  const requiredFields = [
    "firstName",
    "lastName",
    "address",
    "district",
    "state",
    "pinCode",
    "addressType",
  ];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  const new_address = {
    user: userId,
    ...req.body,
  };

  const saved_address = await Address.create(new_address);

  res.status(201).json({
    success: true,
    message: "Address added successfully",
    saved_address,
  });
});

// for updating an existing address
export const update_address = AsyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const address_id = req.params.addressId;
  const address_data = req.body;

  const address = await Address.findOne({ _id: address_id, user: user_id });

  if (!address) {
    return res.status(404).json({ message: "Address not found" });
  }

  address.firstName = address_data.firstName || address.firstName;
  address.lastName = address_data.lastName || address.lastName;
  address.email = address_data.email || address.email;
  address.phone = address_data.phone || address.phone;
  address.address = address_data.address || address.address;
  address.district = address_data.district || address.district;
  address.state = address_data.state || address.state;
  address.landmark = address_data.landmark || address.landmark;
  address.pinCode = address_data.pinCode || address.pinCode;
  address.addressType = address_data.addressType || address.addressType;
  address.is_default =
    address_data.is_default !== undefined
      ? address_data.is_default
      : address.is_default;

  await address.save();

  res.status(200).json({ message: "Address updated successfully", address });
});

// for deleting an existing address
export const delete_address = AsyncHandler(async (req, res) => {
  const address_id = req.params.addressId;

  if (!address_id) {
    return res
      .status(400)
      .json({ success: false, message: "Address ID is required" });
  }

  const deleted_address = await Address.findByIdAndDelete(address_id);

  if (!deleted_address) {
    return res
      .status(404)
      .json({ success: false, message: "Address not found" });
  }

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
    deleted_address,
  });
});
