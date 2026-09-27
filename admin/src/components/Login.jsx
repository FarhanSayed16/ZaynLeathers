import axios from "axios";
import React, { useState } from "react";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import brand from "../brand";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const response = await axios.post(backendUrl + "/api/user/admin", {
        email,
        password,
        rememberMe,
      });
      if (response.data.success) {
        setToken(response.data.token);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-tz-cream px-4 py-10">
      <div className="w-full max-w-md bg-white shadow-soft rounded-3xl px-8 py-10 border border-tz-pink-soft">
        <div className="text-center mb-8">
          <img
            src={brand.logos.navbar}
            alt={brand.name}
            className="h-10 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-display font-semibold text-tz-navy">
            {brand.admin?.panelTitle || `${brand.name} Admin`}
          </h1>
          <p className="text-sm text-tz-navy/50 mt-2">Sign in to pack orders and manage the shop</p>
        </div>

        <form onSubmit={onSubmitHandler} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-tz-navy mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-tz-navy mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border px-4 py-2.5 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-tz-navy/70">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me for 7 days
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-tz-navy text-white font-semibold hover:bg-tz-pink transition disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-tz-navy/40">
          © {new Date().getFullYear()} {brand.name}
        </p>
      </div>
    </div>
  );
};

export default Login;
