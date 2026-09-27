import React, { useEffect, useState } from "react"
import Navbar from "./components/Navbar"
import SideBar from "./components/SideBar"
import { Route, Routes, useLocation } from "react-router-dom"
import Add from "./pages/Add"
import List from "./pages/List"
import Orders from "./pages/Orders"
import Login from "./components/Login"
import { ToastContainer, toast } from "react-toastify"
import axios from "axios"
import { isAdminAuthFailure } from "./utils/adminApi"
import OrderDetail from "./pages/OrderDetail"
import "react-toastify/dist/ReactToastify.css"
import Edit from "./pages/Edit"
import Coupon from "./pages/Coupon"
import Dashboard from "./pages/Dashboard"
import Users from "./pages/Users"
import HeroUpload from "./pages/HeroUpload"
import Settings from "./pages/Settings"
import Categories from "./pages/Categories"
import InstagramPromos from "./pages/InstagramPromos"
import Review from "./pages/Review"
import ProductReviews from "./pages/ProductReviews"
import Contacts from "./pages/Contacts"
import UserDetail from "./pages/UserDetail"
import CatalogCleanup from "./pages/CatalogCleanup"
import Analytics from "./pages/Analytics"
import BulkInvoices from "./pages/BulkInvoices"
import { AdminFeaturesProvider } from "./context/AdminFeaturesContext"

export const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const App = () => {
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  )
  const [features, setFeatures] = useState({})
  const [featuresLoading, setFeaturesLoading] = useState(true)

  useEffect(() => {
    localStorage.setItem("token", token)
  }, [token])

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!token) {
      setFeatures({})
      setFeaturesLoading(false)
      return
    }
    let cancelled = false
    setFeaturesLoading(true)
    axios
      .get(`${backendUrl}/api/settings`)
      .then((res) => {
        if (!cancelled && res.data?.success) {
          setFeatures(res.data.settings?.features || {})
        }
      })
      .catch(() => {
        if (!cancelled) setFeatures({})
      })
      .finally(() => {
        if (!cancelled) setFeaturesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => {
        if (
          token &&
          res.data?.success === false &&
          isAdminAuthFailure(res.data, res.status)
        ) {
          setToken("")
          toast.error("Session expired — please sign in")
        }
        return res
      },
      (err) => {
        if (token && isAdminAuthFailure(err.response?.data, err.response?.status)) {
          setToken("")
          toast.error("Session expired — please sign in")
        }
        return Promise.reject(err)
      }
    )
    return () => axios.interceptors.response.eject(id)
  }, [token])

  if (!token) {
    return (
      <>
        <ToastContainer />
        <Login setToken={setToken} />
      </>
    )
  }

  return (
    <AdminFeaturesProvider features={features} featuresLoading={featuresLoading}>
    <div className="h-screen overflow-hidden bg-tz-cream">
      <ToastContainer />
      <Navbar setToken={setToken} onMenu={() => setNavOpen(true)} />
      <div className="flex h-[calc(100vh-64px)]">
        <SideBar mobileOpen={navOpen} onClose={() => setNavOpen(false)} features={features} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-8 lg:py-6">
          <Routes>
            <Route path="/" element={<Dashboard token={token} />} />
            <Route path="/analytics" element={<Analytics token={token} />} />
            <Route path="/invoices/bulk" element={<BulkInvoices token={token} />} />
            <Route path="/add" element={<Add token={token} />} />
            <Route path="/list" element={<List token={token} />} />
            <Route path="/editProduct/:id" element={<Edit token={token} />} />
            <Route path="/orders" element={<Orders token={token} />} />
            <Route path="/orders/:id" element={<OrderDetail token={token} />} />
            <Route path="/coupons" element={<Coupon token={token} />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/admin/hero" element={<HeroUpload />} />
            <Route path="/review" element={<Review />} />
            <Route path="/product-reviews" element={<ProductReviews />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/catalog-cleanup" element={<CatalogCleanup token={token} />} />
            <Route path="/instagram" element={<InstagramPromos />} />
            <Route path="/contacts" element={<Contacts />} />
          </Routes>
        </main>
      </div>
    </div>
    </AdminFeaturesProvider>
  )
}

export default App
