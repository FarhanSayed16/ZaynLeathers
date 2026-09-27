import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import brand from "../brand";
import { formatPriceUtil } from "../utils/currency";
import { getSizePrice } from "../utils/productMatrix";
import {
  bumpCart,
  cartHasItems,
  clearGuestCart,
  readGuestCart,
  setCartQty,
  writeGuestCart,
} from "../utils/guestCart";
import { isAuthFailure } from "../utils/india";
import { isWooMode, getApiBase } from "../api/mode";
import * as shopApi from "../api/shopApi";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const [selectedCurrency, setSelectedCurrency] = useState(
    () => localStorage.getItem("currency") || "INR"
  );
  const [exchangeRates, setExchangeRates] = useState({ USD: 0, GBP: 0, CAD: 0 });
  const [delivery_fee, setDeliveryFee] = useState(brand.commerce.deliveryFee);
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState(() =>
    localStorage.getItem("token") ? {} : readGuestCart()
  );
  const navigate = useNavigate();

  /** Kept for pages that still append paths in Node mode; Woo mode = site URL. */
  const backendUrl = getApiBase();
  const [products, setProduucts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!localStorage.getItem("token"));
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const logout = useCallback(
    (opts = {}) => {
      const { silent = false, redirect = false, expired = false } = opts;
      localStorage.removeItem("token");
      setToken("");
      setUser(null);
      setWishlistItems([]);
      setAppliedCoupon(null);
      setCartItems(readGuestCart());
      setAuthReady(true);
      if (!silent) {
        toast.info(expired ? "Session expired — please sign in" : "Signed out");
      }
      if (redirect) navigate("/login");
    },
    [navigate]
  );

  const handleAuthError = useCallback(
    (payload, status) => {
      if (!isAuthFailure(payload, status)) return false;
      if (tokenRef.current) logout({ silent: false, redirect: true, expired: true });
      return true;
    },
    [logout]
  );

  const addToCart = useCallback(
    async (itemId, size) => {
      if (!size) {
        toast.error("Please select the Product Size");
        return;
      }

      const next = bumpCart(cartItems, itemId, size);
      setCartItems(next);

      if (!token) {
        writeGuestCart(next);
        toast.success("Added to cart");
        return;
      }

      try {
        const response = await shopApi.addToCart(itemId, size, token);
        if (response.success) {
          if (response.cartData) setCartItems(response.cartData);
          toast.success("Added to cart");
        } else {
          if (!handleAuthError(response, response.status)) {
            toast.error(response.message || "Could not add to cart");
          }
        }
      } catch (error) {
        if (!handleAuthError(error.response?.data, error.response?.status)) {
          toast.error(error.message);
        }
      }
    },
    [token, cartItems, handleAuthError]
  );

  const cartCount = useMemo(() => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          totalCount += cartItems[items][item];
        }
      }
    }
    return totalCount;
  }, [cartItems]);

  const getCartCount = useCallback(() => cartCount, [cartCount]);

  const updateQuantity = useCallback(
    async (itemId, size, quantity) => {
      const next = setCartQty(cartItems, itemId, size, quantity);
      setCartItems(next);

      if (!token) {
        writeGuestCart(next);
        return;
      }

      try {
        const response = await shopApi.updateCart(itemId, size, quantity, token);
        if (response.success && response.cartData) {
          setCartItems(response.cartData);
        } else if (!response.success) {
          handleAuthError(response, response.status);
        }
      } catch (error) {
        handleAuthError(error.response?.data, error.response?.status);
      }
    },
    [token, cartItems, handleAuthError]
  );

  const getCartAmount = useCallback(() => {
    let totalAmount = 0;
    for (const items in cartItems) {
      const itemInfo = products.find((product) => product._id === items);
      if (!itemInfo) continue;
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          totalAmount += getSizePrice(itemInfo, item) * cartItems[items][item];
        }
      }
    }
    return totalAmount;
  }, [cartItems, products]);

  const getProductsData = useCallback(async () => {
    try {
      const response = await shopApi.listProducts();
      if (response.success) {
        setProduucts(response.products);
      } else {
        toast.error(response.message || "Could not load products");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  }, []);

  const getSettingsData = useCallback(async () => {
    try {
      const response = await shopApi.getSettings();
      if (response.success) {
        setSettings(response.settings);
        if (response.settings.deliveryFee !== undefined) {
          setDeliveryFee(response.settings.deliveryFee);
        }
      }
    } catch (error) {
      console.log("Error fetching settings:", error);
    }
  }, []);

  const getCategoriesData = useCallback(async () => {
    try {
      const response = await shopApi.getCategoryTree();
      if (response.success) {
        setCategories(response.categories || []);
        setCategoryTree(response.tree || []);
      }
    } catch (error) {
      console.log("Error fetching categories:", error);
    }
  }, []);

  const fetchProfile = useCallback(
    async (authToken) => {
      try {
        const response = await shopApi.getProfile(authToken);
        if (response.success && response.user) {
          setUser(response.user);
          return true;
        }
        handleAuthError(response, response.status);
        return false;
      } catch (error) {
        handleAuthError(error.response?.data, error.response?.status);
        return false;
      }
    },
    [handleAuthError]
  );

  const refreshProfile = useCallback(async () => {
    if (!token) return false;
    return fetchProfile(token);
  }, [token, fetchProfile]);

  const mergeAndLoadCart = useCallback(
    async (authToken) => {
      const guest = readGuestCart();
      try {
        if (cartHasItems(guest)) {
          const response = await shopApi.mergeCart(guest, authToken);
          if (response.success) {
            setCartItems(response.cartData || {});
            clearGuestCart();
            return;
          }
          if (handleAuthError(response, response.status)) return;
        }

        const response = await shopApi.getCart(authToken);
        if (response.success) {
          setCartItems(response.cartData || {});
        } else {
          handleAuthError(response, response.status);
        }
      } catch (error) {
        handleAuthError(error.response?.data, error.response?.status);
      }
    },
    [handleAuthError]
  );

  const getUserWishlist = useCallback(
    async (authToken) => {
      try {
        const response = await shopApi.getWishlist(authToken);
        if (response.success) {
          setWishlistItems(response.wishlist);
        }
      } catch (error) {
        handleAuthError(error.response?.data, error.response?.status);
      }
    },
    [handleAuthError]
  );

  const addToWishlist = useCallback(
    async (productId) => {
      if (!token) {
        toast.error("Sign in to save a wishlist");
        localStorage.setItem("redirectAfterLogin", window.location.pathname);
        navigate("/login");
        return false;
      }

      const prev = wishlistItems;
      if (!prev.includes(productId)) {
        setWishlistItems([...prev, productId]);
      }

      try {
        const response = await shopApi.addWishlist(productId, token);
        if (response.success) {
          toast.success("Added to Wishlist");
          return true;
        }
        setWishlistItems(prev);
        if (!handleAuthError(response, response.status)) {
          toast.error(response.message || "Could not update wishlist");
        }
        return false;
      } catch (error) {
        setWishlistItems(prev);
        if (!handleAuthError(error.response?.data, error.response?.status)) {
          toast.error(error.message);
        }
        return false;
      }
    },
    [token, wishlistItems, navigate, handleAuthError]
  );

  const updateUserWishlist = useCallback(
    async (productId) => {
      if (!token) {
        toast.error("Sign in to update your wishlist");
        return false;
      }

      const prev = wishlistItems;
      setWishlistItems(prev.filter((id) => id !== productId));

      try {
        const response = await shopApi.removeWishlist(productId, token);
        if (response.success) {
          toast.success("Removed from Wishlist");
          return true;
        }
        setWishlistItems(prev);
        handleAuthError(response, response.status);
        return false;
      } catch (error) {
        setWishlistItems(prev);
        handleAuthError(error.response?.data, error.response?.status);
        return false;
      }
    },
    [token, wishlistItems, handleAuthError]
  );

  const completeLogin = useCallback((newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  const replaceCart = useCallback((next) => {
    setCartItems(next || {});
    if (!tokenRef.current) writeGuestCart(next || {});
  }, []);

  useEffect(() => {
    getProductsData();
    getSettingsData();
    getCategoriesData();
  }, [getProductsData, getSettingsData, getCategoriesData]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!token) {
        setUser(null);
        setWishlistItems([]);
        setCartItems(readGuestCart());
        setAuthReady(true);
        return;
      }

      setAuthReady(false);
      const ok = await fetchProfile(token);
      if (cancelled) return;
      if (!ok) {
        setAuthReady(true);
        return;
      }
      await mergeAndLoadCart(token);
      if (cancelled) return;
      await getUserWishlist(token);
      if (!cancelled) setAuthReady(true);
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [token, fetchProfile, mergeAndLoadCart, getUserWishlist]);

  useEffect(() => {
    shopApi
      .getExchangeRates()
      .then((res) => {
        if (res.success) {
          setExchangeRates(res.rates);
        }
      })
      .catch((err) => console.error("Error fetching exchange rates:", err));
  }, []);

  const formatPrice = useCallback(
    (amount) => formatPriceUtil(amount, selectedCurrency, exchangeRates),
    [selectedCurrency, exchangeRates]
  );

  const getShippingFee = useCallback(
    (subtotal) => {
      const amount = Number(subtotal) || 0;
      const threshold = Number(settings?.freeShippingThreshold);
      if (Number.isFinite(threshold) && threshold > 0 && amount >= threshold) {
        return 0;
      }
      return delivery_fee;
    },
    [settings, delivery_fee]
  );

  const value = useMemo(
    () => ({
      products,
      delivery_fee,
      navigate,
      search,
      setSearch,
      showSearch,
      setShowSearch,
      cartItems,
      addToCart,
      setCartItems: replaceCart,
      getCartCount,
      cartCount,
      updateQuantity,
      getCartAmount,
      getShippingFee,
      backendUrl,
      isWooMode,
      token,
      setToken: completeLogin,
      completeLogin,
      logout,
      user,
      authReady,
      refreshProfile,
      wishlistItems,
      addToWishlist,
      getUserWishlist,
      setWishlistItems,
      updateUserWishlist,
      selectedCurrency,
      setSelectedCurrency,
      exchangeRates,
      formatPrice,
      appliedCoupon,
      setAppliedCoupon,
      settings,
      categories,
      categoryTree,
    }),
    [
      products,
      delivery_fee,
      navigate,
      search,
      showSearch,
      cartItems,
      addToCart,
      replaceCart,
      getCartCount,
      cartCount,
      updateQuantity,
      getCartAmount,
      getShippingFee,
      backendUrl,
      token,
      completeLogin,
      logout,
      user,
      authReady,
      refreshProfile,
      wishlistItems,
      addToWishlist,
      getUserWishlist,
      updateUserWishlist,
      selectedCurrency,
      exchangeRates,
      formatPrice,
      appliedCoupon,
      settings,
      categories,
      categoryTree,
    ]
  );

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
