import userModel from "../models/userModel.js";
import {
  MAX_ADDRESSES,
  normalizeAddress,
  validateAddress,
} from "../utils/userAddresses.js";

function ensureCustomer(req, res) {
  if (!req.user?._id || req.isAdmin) {
    res.json({ success: false, message: "Please login as a customer." });
    return false;
  }
  return true;
}

export const updateProfile = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const user = await userModel.findById(req.user._id);
    if (!user) return res.json({ success: false, message: "User not found" });

    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const phone = String(req.body.phone || "").replace(/\D/g, "").slice(0, 15);

    if (!firstName || !lastName) {
      return res.json({ success: false, message: "First and last name are required" });
    }
    if (phone && phone.length < 10) {
      return res.json({ success: false, message: "Enter a valid phone number" });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    if (phone) user.phone = phone;
    await user.save();

    const safe = user.toObject();
    delete safe.password;
    delete safe.otp;
    delete safe.otpExpires;
    delete safe.resetPasswordToken;
    delete safe.resetPasswordExpires;

    res.json({ success: true, user: safe, message: "Profile updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const listAddresses = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;
    const user = await userModel.findById(req.user._id).select("addresses");
    res.json({ success: true, addresses: user?.addresses || [] });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const user = await userModel.findById(req.user._id);
    if (!user) return res.json({ success: false, message: "User not found" });

    if ((user.addresses || []).length >= MAX_ADDRESSES) {
      return res.json({
        success: false,
        message: `You can save up to ${MAX_ADDRESSES} addresses`,
      });
    }

    const incoming = normalizeAddress(req.body);
    const error = validateAddress(incoming);
    if (error) return res.json({ success: false, message: error });

    if (incoming.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((row) => {
        row.isDefault = false;
      });
      incoming.isDefault = true;
    }

    user.addresses.push(incoming);
    await user.save();

    res.json({
      success: true,
      addresses: user.addresses,
      message: "Address saved",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const user = await userModel.findById(req.user._id);
    if (!user) return res.json({ success: false, message: "User not found" });

    const row = user.addresses.id(req.params.id);
    if (!row) return res.json({ success: false, message: "Address not found" });

    const incoming = normalizeAddress({ ...row.toObject(), ...req.body });
    const error = validateAddress(incoming);
    if (error) return res.json({ success: false, message: error });

    if (incoming.isDefault) {
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });
    }

    row.set(incoming);
    if (!user.addresses.some((item) => item.isDefault)) {
      row.isDefault = true;
    }

    await user.save();
    res.json({ success: true, addresses: user.addresses, message: "Address updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const user = await userModel.findById(req.user._id);
    if (!user) return res.json({ success: false, message: "User not found" });

    const row = user.addresses.id(req.params.id);
    if (!row) return res.json({ success: false, message: "Address not found" });

    const wasDefault = row.isDefault;
    row.deleteOne();

    if (wasDefault && user.addresses.length) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ success: true, addresses: user.addresses, message: "Address removed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    if (!ensureCustomer(req, res)) return;

    const user = await userModel.findById(req.user._id);
    if (!user) return res.json({ success: false, message: "User not found" });

    const row = user.addresses.id(req.params.id);
    if (!row) return res.json({ success: false, message: "Address not found" });

    user.addresses.forEach((item) => {
      item.isDefault = String(item._id) === String(row._id);
    });
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
