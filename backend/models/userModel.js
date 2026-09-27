import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home", trim: true },
    firstName: { type: String, default: "", trim: true },
    lastName: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    street: { type: String, required: true, trim: true },
    apartment: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    zipcode: { type: String, default: "", trim: true },
    country: { type: String, default: "India", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,

    isVerified: { type: Boolean, default: false },

    otp: String,
    otpExpires: Date,

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    wishlist: { type: [String], default: [] },

    cartData: {
      type: Object,
      default: {},
    },

    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
