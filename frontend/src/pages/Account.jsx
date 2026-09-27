import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import AddressFormFields from "../components/AddressFormFields";
import { addressToForm, emptyAddress, formatAddressLine } from "../utils/india";
import { Link, useNavigate } from "react-router-dom";
import * as shopApi from "../api/shopApi";
import { isWooMode } from "../api/mode";

const Account = () => {
  const { token, user, refreshProfile, logout, navigate: shopNavigate } =
    useContext(ShopContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [savingPw, setSavingPw] = useState(false);

  const addresses = user?.addresses || [];

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
    });
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await shopApi.updateProfile(profile, token);
      if (res.success) {
        toast.success("Profile saved");
        await refreshProfile();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not save profile");
    }
    setSavingProfile(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      const res = await shopApi.changePassword(pw, token);
      if (res.success !== false) {
        toast.success("Password updated");
        setPw({ currentPassword: "", newPassword: "" });
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not update password");
    }
    setSavingPw(false);
  };

  const openNew = () => {
    // Woo only has billing + shipping slots
    if (isWooMode && addresses.length >= 2) {
      toast.info("Edit billing or shipping address instead — WooCommerce supports two address slots");
      return;
    }
    setEditingId(isWooMode ? (addresses.length === 0 ? "billing" : "shipping") : null);
    setForm({
      ...emptyAddress,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      isDefault: addresses.length === 0,
    });
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr._id);
    setForm(addressToForm(addr, user));
    setShowForm(true);
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await shopApi.saveAddress(form, editingId, token);
      if (res.success) {
        toast.success(res.message || "Address saved");
        setShowForm(false);
        await refreshProfile();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not save address");
    }
    setSavingAddress(false);
  };

  const removeAddress = async (id) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      const res = await shopApi.deleteAddress(id, token);
      if (res.success) {
        toast.success("Address removed");
        await refreshProfile();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Could not remove address");
    }
  };

  const makeDefault = async (id) => {
    try {
      const res = await shopApi.setDefaultAddress(id, token);
      if (res.success) {
        await refreshProfile();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Could not update default address");
    }
  };

  if (!token) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Title text1="MY" text2="ACCOUNT" />
      <p className="text-sm text-tz-navy/60 mt-2 mb-8">
        Signed in as <span className="font-medium text-tz-navy">{user?.email}</span>
      </p>

      <section className="bg-white rounded-2xl border border-tz-border/40 p-5 sm:p-6 mb-6">
        <h3 className="font-display text-xl text-tz-navy mb-4">Profile</h3>
        <form onSubmit={saveProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-tz-navy/70">First name</label>
              <input
                className="input"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-tz-navy/70">Last name</label>
              <input
                className="input"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-tz-navy/70">Phone</label>
            <input
              className="input"
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="bg-tz-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-tz-pink"
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-2xl border border-tz-border/40 p-5 sm:p-6 mb-6">
        <h3 className="font-display text-xl text-tz-navy mb-4">Password</h3>
        <form onSubmit={changePassword} className="space-y-3 max-w-md">
          <div>
            <label className="text-xs font-semibold text-tz-navy/70">Current password</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-tz-navy/70">New password</label>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            disabled={savingPw}
            className="bg-tz-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-tz-pink"
          >
            {savingPw ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-2xl border border-tz-border/40 p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-display text-xl text-tz-navy">Addresses</h3>
          {addresses.length < 5 && (
            <button
              type="button"
              onClick={openNew}
              className="text-sm font-semibold text-tz-pink hover:underline"
            >
              Add address
            </button>
          )}
        </div>

        {addresses.length === 0 && !showForm && (
          <p className="text-sm text-tz-navy/60 mb-3">
            No saved addresses yet. Add one so checkout is filled in next time.
          </p>
        )}

        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`rounded-xl border p-4 ${
                addr.isDefault ? "border-tz-navy" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-tz-navy">
                    {addr.label || "Address"}
                    {addr.isDefault && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-tz-pink">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-tz-navy/70 mt-1">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p className="text-xs text-tz-navy/55 mt-1">{formatAddressLine(addr)}</p>
                  <p className="text-xs text-tz-navy/55">{addr.phone}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs font-semibold">
                {!addr.isDefault && (
                  <button type="button" onClick={() => makeDefault(addr._id)} className="text-tz-navy">
                    Set default
                  </button>
                )}
                <button type="button" onClick={() => openEdit(addr)} className="text-tz-navy">
                  Edit
                </button>
                <button type="button" onClick={() => removeAddress(addr._id)} className="text-tz-cherry">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <form onSubmit={saveAddress} className="mt-5 border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold mb-3">
              {editingId ? "Edit address" : "New address"}
            </p>
            <AddressFormFields value={form} onChange={setForm} />
            <label className="flex items-center gap-2 mt-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.isDefault)}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              Default shipping address
            </label>
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={savingAddress}
                className="bg-tz-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                {savingAddress ? "Saving…" : "Save address"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/orders" className="font-semibold text-tz-navy hover:text-tz-pink">
          View orders
        </Link>
        <button
          type="button"
          onClick={() => {
            logout({ silent: true });
            shopNavigate("/");
          }}
          className="font-semibold text-tz-cherry"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Account;
