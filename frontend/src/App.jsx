import React, { lazy, Suspense, useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import PromoStrip from "./components/PromoStrip";
import BackToTop from "./components/BackToTop";
import FloatingCart from "./components/FloatingCart";
import WelcomePopup from "./components/WelcomePopup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AOS from "aos";
import "aos/dist/aos.css";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Products = lazy(() => import("./pages/Products"));
const Cart = lazy(() => import("./pages/Cart"));
const PlaceOrder = lazy(() => import("./pages/PlaceOrder"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Register = lazy(() => import("./pages/Register"));
const Account = lazy(() => import("./pages/Account"));
const Policy = lazy(() => import("./pages/Policy"));
const CustomJackets = lazy(() => import("./pages/CustomJackets"));
const NotFound = lazy(() => import("./pages/NotFound"));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PageFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-tz-pink border-t-transparent animate-spin" />
  </div>
);

const App = () => {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    AOS.init({
      duration: reduced ? 0 : 550,
      once: true,
      easing: "ease-out-cubic",
      offset: 40,
      mirror: false,
      disable: reduced,
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-tz-cream text-tz-navy selection:bg-tz-pink/35 selection:text-tz-navy">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />
      <ScrollToTop />

      <div className="sticky top-0 z-50">
        <PromoStrip />
        <Navbar />
      </div>

      <SearchBar />

      <main className="flex-1 w-full overflow-x-clip">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/custom-jackets" element={<CustomJackets />} />
            <Route path="/totes" element={<Navigate to="/shop?department=bags" replace />} />
            <Route path="/accessories" element={<Navigate to="/shop?department=accessories" replace />} />
            <Route path="/mens" element={<Navigate to="/shop?department=men" replace />} />
            <Route path="/womens" element={<Navigate to="/shop?department=women" replace />} />
            <Route path="/collection" element={<Navigate to="/shop" replace />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/product/:productId" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/place-order" element={<PlaceOrder />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/account" element={<Account />} />
            <Route path="/shipping-policy" element={<Navigate to="/policy/shipping" replace />} />
            <Route path="/return-refund" element={<Navigate to="/policy/returns" replace />} />
            <Route path="/privacy" element={<Navigate to="/policy/privacy" replace />} />
            <Route path="/terms" element={<Navigate to="/policy/terms" replace />} />
            <Route path="/policy/:slug" element={<Policy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <BackToTop />
      <FloatingCart />
      <WelcomePopup />
    </div>
  );
};

export default App;
