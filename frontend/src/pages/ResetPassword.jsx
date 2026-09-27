import React, { useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaLock, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import * as shopApi from "../api/shopApi";
import { isWooMode, getApiBase } from "../api/mode";

const ResetPassword = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";
  const navigate = useNavigate();

  const apiReady = useMemo(() => {
    if (isWooMode) return Boolean(import.meta.env.VITE_WC_URL);
    return Boolean(getApiBase());
  }, []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    if (!apiReady) {
      toast.error(
        isWooMode
          ? "App is misconfigured (missing VITE_WC_URL). Contact support."
          : "App is misconfigured (missing VITE_BACKEND_URL). Contact support."
      );
      return;
    }

    if (isWooMode && !emailFromQuery) {
      toast.error("Reset link is missing email. Request a new link from Forgot Password.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const res = await shopApi.resetPassword(token, password, emailFromQuery);

      if (res.success !== false) {
        toast.success("Password updated successfully!");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error(
          res.message ||
            "Reset failed. The link may have expired — request a new one."
        );
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        (error.code === "ERR_NETWORK"
          ? "Cannot reach the server. Check your connection or try again later."
          : "Reset failed. Request a new reset link and try again.");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tz-cream flex items-center justify-center p-4">
      <form
        onSubmit={submitHandler}
        className="relative bg-white p-6 sm:p-8 rounded-2xl shadow-soft w-full max-w-sm sm:max-w-md border border-tz-pink/15"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-tz-navy rounded-2xl mb-4 shadow-lg">
            <FaKey className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-tz-navy">Reset Password</h2>
          <p className="text-gray-500 mt-2">Create a new secure password</p>
          {!token && (
            <p className="text-red-500 text-sm mt-3">
              This reset link is invalid. Please request a new one from Forgot Password.
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            New Password
          </label>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-tz-navy transition-all bg-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <FaEyeSlash className="w-5 h-5" />
              ) : (
                <FaEye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-tz-navy transition-all bg-white"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <FaEyeSlash className="w-5 h-5" />
              ) : (
                <FaEye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {password && (
          <div className="mb-4">
            <div className="flex gap-1 h-1">
              <div
                className={`flex-1 h-full rounded-l ${
                  password.length >= 8 ? "bg-green-500" : "bg-gray-200"
                }`}
              />
              <div
                className={`flex-1 h-full ${
                  /[A-Z]/.test(password) ? "bg-green-500" : "bg-gray-200"
                }`}
              />
              <div
                className={`flex-1 h-full rounded-r ${
                  /[0-9]/.test(password) ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !token}
          className="w-full bg-tz-navy text-white hover:bg-tz-pink py-3 rounded-xl font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Updating..." : "Update Password"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="w-full text-center text-gray-500 hover:text-tz-navy text-sm font-medium mt-3 transition-colors"
        >
          Request a new reset link
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full text-center text-gray-500 hover:text-tz-navy text-sm font-medium mt-2 transition-colors"
        >
          ← Back to Login
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
