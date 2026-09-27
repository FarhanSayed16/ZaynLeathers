import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  userData: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 minutes
  }
});

const otpModel = mongoose.models.otp || mongoose.model("otp", otpSchema);
export default otpModel;
