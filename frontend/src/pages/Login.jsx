import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
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
    <div className="bg-tz-cream px-4 pt-4 pb-8 sm:py-12">
      <form
        onSubmit={submitHandler}
        className="mx-auto w-full max-w-md bg-white border border-tz-navy/10 px-5 py-6 sm:p-8"
      >
        <div className="mb-5">
          <h1 className="font-display text-3xl text-tz-navy">Sign in</h1>
          <p className="mt-1 text-sm text-tz-navy/60">Use the email on your Zayn Leathers account.</p>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-tz-navy/45 mb-1.5" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
            className="w-full px-3 py-2.5 border border-tz-navy/15 text-sm text-tz-navy focus:outline-none focus:border-tz-navy"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-tz-navy/45 mb-1.5" htmlFor="login-password">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 pr-11 border border-tz-navy/15 text-sm text-tz-navy focus:outline-none focus:border-tz-navy"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tz-navy/40"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 mb-5 text-sm text-tz-navy/70">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Keep me signed in
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-tz-navy text-white py-3 text-sm font-semibold tracking-wide disabled:opacity-50"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" onClick={() => navigate("/register")} className="font-semibold text-tz-navy underline underline-offset-4">
            Create account
          </button>
          <button type="button" onClick={() => navigate("/forgot-password")} className="text-tz-navy/60 underline underline-offset-4">
            Forgot password
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;