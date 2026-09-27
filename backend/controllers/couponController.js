import Coupon from "../models/couponModel.js";

const createCoupon = async (req, res) => {
  try {
    const { code, discount, expiry, usageLimit, minOrderAmount } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: "Coupon code already exists" });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discount,
      expiry,
      usageLimit: Number(usageLimit) || 0,
      minOrderAmount: Number(minOrderAmount) || 0,
      isActive: true,
    });

    await coupon.save();
    res.status(201).json({ message: "Coupon created successfully", coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ error: "Invalid coupon code" });
    }

    if (coupon.isActive === false) {
      return res.status(400).json({ error: "This coupon is not active" });
    }

    if (new Date() > coupon.expiry) {
      return res.status(400).json({ error: "Coupon has expired" });
    }

    const amount = Number(req.query.amount || req.body?.amount || 0);
    if (coupon.minOrderAmount > 0 && amount > 0 && amount < coupon.minOrderAmount) {
      return res.status(400).json({
        error: `Minimum order ₹${coupon.minOrderAmount} required`,
      });
    }

    if (coupon.usageLimit > 0 && coupon.usedBy.length >= coupon.usageLimit) {
      return res.status(400).json({ error: "Coupon usage limit reached" });
    }

    const userId = req.user?._id || req.userId;
    if (coupon.usedBy?.length && userId) {
      const used = coupon.usedBy.some(
        (id) => String(id) === String(userId)
      );
      if (used) {
        return res.status(400).json({ error: "You have already used this coupon" });
      }
    }

    res.json({ valid: true, discount: coupon.discount });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      expiry: { $gt: now },
      isActive: { $ne: false },
    })
      .select("code discount expiry")
      .sort({ createdAt: -1 })
      .limit(8);
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { isActive, minOrderAmount, discount, expiry, usageLimit } = req.body;
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(minOrderAmount !== undefined ? { minOrderAmount: Number(minOrderAmount) || 0 } : {}),
        ...(discount !== undefined ? { discount: Number(discount) } : {}),
        ...(expiry ? { expiry } : {}),
        ...(usageLimit !== undefined ? { usageLimit: Number(usageLimit) || 0 } : {}),
      },
      { new: true }
    );
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { createCoupon, validateCoupon, getAllCoupons, getActiveCoupons, updateCoupon, deleteCoupon };
