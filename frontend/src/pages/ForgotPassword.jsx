import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaPaperPlane, FaArrowLeft } from "react-icons/fa";
import * as shopApi from "../api/shopApi";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await shopApi.forgotPassword(email);

      if (res.success !== false) {
        setIsSent(true);
        toast.success("Reset link sent to your email! 📧");
      } else {
        toast.error(res.message || "Failed to send reset email");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen mt-10 bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative bg-white/80 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md border border-white/20">
        {!isSent ? (
          <form onSubmit={submitHandler}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4 shadow-lg transform transition-transform duration-300 hover:rotate-12">
                <FaEnvelope className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-black bg-clip-text text-transparent">
                Forgot Password?
              </h2>
              <p className="text-gray-500 mt-2">
                No worries! Enter your email and we'll send you a reset link.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-orange-100 transition-all duration-300 bg-white/50"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold text-lg transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <FaPaperPlane className="w-5 h-5 mr-2" />
                  Send Reset Link
                </div>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <FaEnvelope className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h3>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to<br />
              <span className="font-semibold text-orange-600">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Didn't receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setIsSent(false)}
                className="text-orange-600 hover:underline font-medium"
              >
                try again
              </button>
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full text-center text-gray-500 hover:text-orange-600 text-sm font-medium transition-colors flex items-center justify-center"
        >
          <FaArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
