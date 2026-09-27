import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import brand from "../brand";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhone,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import * as shopApi from "../api/shopApi";
import { isWooMode } from "../api/mode";

const Register = () => {
  const navigate = useNavigate();
  const { completeLogin } = useContext(ShopContext);

  const [step, setStep] = useState("register");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (step !== "otp") return undefined;
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const finishAuth = (token) => {
    completeLogin(token);
    localStorage.removeItem("verifyEmail");
    toast.success(`Welcome to ${brand.name}!`);
    const redirect = localStorage.getItem("redirectAfterLogin");
    localStorage.removeItem("redirectAfterLogin");
    navigate(redirect || "/");
  };

  const submitRegister = async (e) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      return toast.error("All fields are required");
    }

    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (form.password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    setIsLoading(true);

    try {
      const res = await shopApi.register(form);

      if (res.success) {
        // Woo mode: account created + logged in (no OTP)
        if (res.token || res.skipOtp) {
          finishAuth(res.token);
        } else {
          localStorage.setItem("verifyEmail", form.email.trim().toLowerCase());
          toast.success(res.message || "OTP sent to email");
          setStep("otp");
          setOtp(["", "", "", "", "", ""]);
          setTimer(60);
        }
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Registration failed. Please try again."
      );
    }

    setIsLoading(false);
  };

  const submitOtp = async (e) => {
    e.preventDefault();

    if (isWooMode) {
      return toast.error("OTP is not required for this store");
    }

    const email = localStorage.getItem("verifyEmail");
    const otpValue = otp.join("");

    if (!email) return toast.error("Session expired. Please register again.");

    if (otpValue.length !== 6) {
      return toast.error("Enter the complete 6-digit OTP");
    }

    setIsLoading(true);

    try {
      const res = await shopApi.verifyOtp({
        email,
        otp: otpValue,
        rememberMe: true,
      });

      if (res.success) {
        finishAuth(res.token);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "OTP verification failed");
    }

    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    if (isWooMode) return;
    const email = localStorage.getItem("verifyEmail") || form.email;
    if (!email) return toast.error("Session expired. Please register again.");
    if (timer > 0) return;

    setIsResending(true);
    try {
      const res = await shopApi.resendOtp({ email });

      if (res.success) {
        toast.success(res.message || "OTP resent");
        setOtp(["", "", "", "", "", ""]);
        setTimer(60);
        document.getElementById("otp-0")?.focus();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not resend OTP");
    }
    setIsResending(false);
  };

  const applyOtpDigits = (digits, startIndex = 0) => {
    const clean = String(digits || "").replace(/\D/g, "").slice(0, 6 - startIndex);
    if (!clean) return;

    const next = [...otp];
    clean.split("").forEach((ch, idx) => {
      next[startIndex + idx] = ch;
    });
    setOtp(next);

    const focusAt = Math.min(startIndex + clean.length, 5);
    requestAnimationFrame(() => {
      document.getElementById(`otp-${focusAt}`)?.focus();
    });
  };

  const handleOtpChange = (i, val) => {
    // Mobile autofill / paste can land multiple digits in one input
    if (val && val.replace(/\D/g, "").length > 1) {
      applyOtpDigits(val, 0);
      return;
    }

    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[i] = digit;
    setOtp(newOtp);

    if (digit && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData?.getData("text") || "";
    applyOtpDigits(pasted, 0);
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tz-cream px-4 py-10">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-tz-navy rounded-xl flex items-center justify-center mx-auto mb-3">
            <FaUser className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-tz-navy">
            {step === "register" ? "Create Account" : "Verify OTP"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {step === "register"
              ? "Sign up to get started"
              : "Enter the 6-digit code sent to your email. Code is valid for 10 minutes."}
          </p>
        </div>

        {step === "register" ? (
          <form onSubmit={submitRegister} className="space-y-4">
            <div className="flex gap-2">
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="First Name"
                className="input"
                required
              />
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                className="input"
                required
              />
            </div>

            <div className="relative">
              <FaEnvelope className="icon" />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className="input input-icon"
                required
              />
            </div>

            <div className="relative">
              <FaPhone className="icon" />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="input input-icon"
                required
              />
            </div>

            <div className="relative">
              <FaLock className="icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className="input input-icon"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="eye"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            {form.password && (
              <div className="space-y-1">
                <div className="flex gap-1 h-1">
                  <div
                    className={`flex-1 ${
                      form.password.length >= 8 ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                  <div
                    className={`flex-1 ${
                      /[A-Z]/.test(form.password) ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                  <div
                    className={`flex-1 ${
                      /[0-9]/.test(form.password) ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Use 8+ characters, uppercase &amp; number
                </p>
              </div>
            )}

            <div className="relative">
              <FaLock className="icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="input input-icon"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="eye"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? (
                  <FaEyeSlash size={18} />
                ) : (
                  <FaEye size={18} />
                )}
              </button>
            </div>

            {form.confirmPassword && (
              <p
                className={`text-xs ${
                  form.password === form.confirmPassword
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {form.password === form.confirmPassword
                  ? "Passwords match"
                  : "Passwords do not match"}
              </p>
            )}

            <button type="submit" className="btn" disabled={isLoading}>
              {isLoading ? "Creating..." : "Register"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="link"
              >
                Sign In
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="space-y-6 text-center">
            <p className="text-xs text-gray-500 break-all">
              Sent to {localStorage.getItem("verifyEmail") || form.email}
            </p>

            <div className="flex justify-center gap-2">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  value={d}
                  maxLength={i === 0 ? 6 : 1}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onPaste={handleOtpPaste}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="otp-box"
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400">Tip: you can paste the full 6-digit code</p>

            <div className="text-sm text-gray-500 space-y-2">
              {timer > 0 ? (
                <p>Resend available in {timer}s</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="link underline"
                >
                  {isResending ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>

            <button type="submit" className="btn" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("register");
                setOtp(["", "", "", "", "", ""]);
              }}
              className="text-sm text-gray-500 hover:text-tz-navy"
            >
              ← Back to registration
            </button>
          </form>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          outline: none;
        }
        .input-icon {
          padding-left: 40px;
          padding-right: 40px;
        }
        .input:focus {
          border-color: #1A2238;
        }
        .btn {
          width: 100%;
          padding: 12px;
          background: #1A2238;
          color: white;
          border-radius: 10px;
          font-weight: 600;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: gray;
          width: 16px;
          pointer-events: none;
        }
        .eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: gray;
          background: none;
          border: none;
          padding: 0;
        }
        .otp-box {
          width: 42px;
          height: 48px;
          border: 1px solid #ccc;
          border-radius: 8px;
          text-align: center;
          font-size: 18px;
        }
        .otp-box:focus {
          border-color: #1A2238;
          outline: none;
        }
        .link {
          color: #1A2238;
          cursor: pointer;
          font-weight: 500;
          background: none;
          border: none;
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default Register;
