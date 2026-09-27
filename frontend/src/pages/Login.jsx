import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { FaEnvelope, FaLock, FaSignInAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import * as shopApi from "../api/shopApi";

const Login = () => {
  const navigate = useNavigate();
  const { completeLogin } = useContext(ShopContext);

  const [email, setEmail] = useState(() => localStorage.getItem("zayn_email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await shopApi.login(email, password, rememberMe);

      if (res.success) {
        localStorage.setItem("zayn_email", email.trim().toLowerCase());
        completeLogin(res.token);
        toast.success("Login successful! 🎉");

        const redirect = localStorage.getItem("redirectAfterLogin");
        localStorage.removeItem("redirectAfterLogin");

        navigate(redirect || "/");
      } else {
        toast.error(res.message || "Login failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tz-cream flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <form
        onSubmit={submitHandler}
        className="relative bg-white/80 backdrop-blur-lg p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md border border-white/20 transform transition-all duration-300 hover:shadow-3xl"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4 shadow-lg transform transition-transform duration-300 hover:scale-110">
            <FaSignInAlt className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-black bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-gray-500 mt-2">Sign in to continue shopping</p>
        </div>

        {/* Email Input */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Email Address
          </label>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-700 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-white/50"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Password
          </label>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-gray-700 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-white/50"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Options Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-gray-700 hover:text-purple-600 text-sm font-medium transition-colors hover:underline"
          >
            Create new account
          </button>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <label className="flex items-center gap-2 mb-6 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Keep me signed in (90 days)
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 py-3 rounded-xl font-semibold text-lg transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Logging in...
            </div>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;