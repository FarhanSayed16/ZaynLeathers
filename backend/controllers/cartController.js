import userModel from "../models/userModel.js";
import { mergeCartObjects, persistCart } from "../utils/cartMerge.js";

const addToCart = async (req, res) => {
  try {
    if (!req.user?._id || req.isAdmin) {
      return res.json({ success: false, message: "Please login as a customer to use cart." });
    }
    const userId = req.user._id;
    const { itemId, size } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const cartData = userData.cartData && typeof userData.cartData === "object"
      ? userData.cartData
      : {};

    if (cartData[itemId]) {
      cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }

    await persistCart(userData, cartData);

    res.json({
      success: true,
      message: "Product added to cart",
      cartData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Add to cart failed",
    });
  }
};

const updateCart = async (req, res) => {
  try {
    if (!req.user?._id || req.isAdmin) {
      return res.json({ success: false, message: "Please login as a customer to use cart." });
    }
    const userId = req.user._id;
    const { itemId, size, quantity } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    const cartData = userData.cartData && typeof userData.cartData === "object"
      ? userData.cartData
      : {};

    if (!cartData[itemId]) cartData[itemId] = {};
    const qty = Number(quantity) || 0;
    if (qty <= 0) {
      delete cartData[itemId][size];
      if (!Object.keys(cartData[itemId]).length) delete cartData[itemId];
    } else {
      cartData[itemId][size] = qty;
    }

    await persistCart(userData, cartData);

    res.json({
      success: true,
      message: "Cart updated",
      cartData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Update cart failed",
    });
  }
};

const getUserCart = async (req, res) => {
  try {
    if (!req.user?._id || req.isAdmin) {
      return res.json({ success: false, message: "Please login as a customer to use cart." });
    }
    const userId = req.user._id;
    const userData = await userModel.findById(userId);

    res.json({
      success: true,
      cartData: userData?.cartData || {},
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
};

const mergeGuestCart = async (req, res) => {
  try {
    if (!req.user?._id || req.isAdmin) {
      return res.json({ success: false, message: "Please login as a customer to use cart." });
    }

    const userData = await userModel.findById(req.user._id);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    const merged = mergeCartObjects(userData.cartData, req.body.guestCart);
    await persistCart(userData, merged);

    res.json({
      success: true,
      cartData: merged,
      message: "Cart synced",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to merge cart",
    });
  }
};

export { addToCart, updateCart, getUserCart, mergeGuestCart };
