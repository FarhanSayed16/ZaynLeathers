import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import { FaTrashAlt } from 'react-icons/fa'
import CartTotal from '../components/CartTotal'
import CouponInput from '../components/CouponInput'
import RecommendationRail from '../components/RecommendationRail'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { getSizePrice } from '../utils/productMatrix'

const Cart = () => {
  const { products, formatPrice, cartItems, updateQuantity, navigate, getCartAmount, token } =
    useContext(ShopContext)

  const [cartData, setCartData] = useState([])
  const [hoveredItem, setHoveredItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (products.length > 0) {
      const tempData = []
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item],
            })
          }
        }
      }
      setCartData(tempData)
      setIsLoading(false)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [cartItems, products])

  const handleCheckout = () => {
    if (getCartAmount() === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (!token) {
      toast.info('Sign in to complete your order — your cart will be waiting')
      localStorage.setItem('redirectAfterLogin', '/place-order')
      navigate('/login')
      return
    }

    navigate('/place-order')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  }

  const summaryVariants = {
    hidden: { x: 20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        delay: 0.3
      }
    }
  }

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.02,
      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
      transition: { type: "spring", stiffness: 400, damping: 17 }
    },
    tap: { scale: 0.98 }
  }

  const quantityButtonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, backgroundColor: "#d1d5db" },
    tap: { scale: 0.9 }
  }

  if (isLoading) {
    return (
      <div className="pt-20 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[8vw] min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full"
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen mt-10 bg-white pt-16 sm:pt-20 px-4 sm:px-5 md:px-6 lg:px-8 pb-10"
    >
      {/* Header with animation */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-10 h-10 bg-tz-navy rounded-none flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </motion.div>
          <Title text1={'YOUR'} text2={'CART'} />
        </div>

        {/* Cart Stats for Mobile */}
        {cartData.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 mt-2 ml-12"
          >
            {cartData.length} {cartData.length === 1 ? 'item' : 'items'} in your cart
          </motion.p>
        )}
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* LEFT: CART ITEMS */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full lg:w-[60%] space-y-3 sm:space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {cartData.length > 0 ? (
              cartData.map((item, index) => {
                const productData = products.find(
                  (product) => product._id === item._id
                )
                const lineUnitPrice = productData ? getSizePrice(productData, item.size) : 0

                return (
                  <motion.div
                    key={`${item._id}-${item.size}`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ 
                      x: -100, 
                      opacity: 0,
                      transition: { duration: 0.3 }
                    }}
                    layout
                    onHoverStart={() => setHoveredItem(`${item._id}-${item.size}`)}
                    onHoverEnd={() => setHoveredItem(null)}
                    className="relative group"
                  >
                    <motion.div
                      animate={hoveredItem === `${item._id}-${item.size}` ? {
                        scale: 1.02,
                        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                      } : {
                        scale: 1,
                        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="bg-white p-4 sm:p-6 border-b border-gray-200 overflow-hidden"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        {/* Product Image with Hover Effect */}
                        <Link to={`/product/${productData._id}`} className="relative">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative overflow-hidden rounded-none bg-gray-50 border border-gray-100"
                          >
                            <img
                              src={productData.image[0]}
                              alt={productData.name}
                              className="w-16 h-20 sm:w-20 sm:h-24 object-contain p-2"
                            />
                            <motion.div
                              initial={{ x: '-100%' }}
                              animate={hoveredItem === `${item._id}-${item.size}` ? { x: '100%' } : { x: '-100%' }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            />
                          </motion.div>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link to={`/product/${productData._id}`}>
                                <motion.p 
                                  className="font-medium text-sm sm:text-base truncate max-w-[150px] sm:max-w-[200px]"
                                  whileHover={{ color: '#000', x: 2 }}
                                >
                                  {productData.name}
                                </motion.p>
                              </Link>

                              <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                                <motion.span 
                                  key={`${item._id}-${item.size}-${lineUnitPrice}`}
                                  initial={{ scale: 1.2, color: '#000' }}
                                  animate={{ scale: 1, color: '#374151' }}
                                  className="font-semibold text-sm sm:text-base"
                                >
                                  {formatPrice(lineUnitPrice)}
                                </motion.span>
                                <motion.span 
                                  whileHover={{ scale: 1.1, backgroundColor: '#e5e7eb' }}
                                  className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-none text-xs font-medium"
                                >
                                  Size: {item.size}
                                </motion.span>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item._id, item.size, 0)}
                              className="p-2 hover:bg-gray-100 rounded-none transition-colors"
                            >
                              <FaTrashAlt className="w-4 h-4 sm:w-4.5 sm:h-4.5 opacity-60 hover:opacity-100 text-tz-navy" />
                            </motion.button>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                            <div className="flex items-center gap-1 sm:gap-2 border border-gray-200 rounded-none p-1">
                              <motion.button
                                variants={quantityButtonVariants}
                                initial="initial"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() =>
                                  item.quantity > 1 &&
                                  updateQuantity(item._id, item.size, item.quantity - 1)
                                }
                                disabled={item.quantity <= 1}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-none flex items-center justify-center text-lg font-medium transition-colors ${
                                  item.quantity <= 1 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-gray-100'
                                }`}
                              >
                                -
                              </motion.button>
                              
                              <motion.span 
                                key={item.quantity}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className="text-sm sm:text-base font-medium w-6 sm:w-8 text-center"
                              >
                                {item.quantity}
                              </motion.span>
                              
                              <motion.button
                                variants={quantityButtonVariants}
                                initial="initial"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() =>
                                  updateQuantity(item._id, item.size, item.quantity + 1)
                                }
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-none hover:bg-gray-100 flex items-center justify-center text-lg font-medium transition-colors"
                              >
                                +
                              </motion.button>
                            </div>

                            {/* Item Total */}
                            <motion.div 
                              className="text-xs sm:text-sm text-gray-500"
                              animate={item.quantity > 0 ? {
                                scale: [1, 1.05, 1],
                              } : {}}
                            >
                              Total: <span className="font-semibold text-black">
                                {formatPrice(lineUnitPrice * item.quantity)}
                              </span>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 sm:py-20 bg-white border border-gray-200 rounded-none shadow-sm"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 mx-auto mb-6 bg-transparent border-2 border-gray-200 rounded-none flex items-center justify-center"
                >
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </motion.div>
                <p className="text-gray-500 mb-6 font-display text-lg">Your cart is empty. Discover leather jackets, bags, and more.</p>
                <Link to="/shop">
                  <motion.button
                    variants={buttonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                    className="bg-tz-navy text-white hover:bg-gray-800 transition-colors duration-300 px-10 py-3.5 text-sm rounded-none font-semibold tracking-wider"
                  >
                    Add Products
                  </motion.button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue Shopping Link */}
          {cartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center sm:text-left"
            >
              <Link to="/shop">
                <motion.span
                  whileHover={{ x: -5 }}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Continue Shopping
                </motion.span>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* RIGHT: SUMMARY */}
        <motion.div
          variants={summaryVariants}
          initial="hidden"
          animate="visible"
          className="w-full lg:w-[40%]"
        >
          <div className="sticky top-24">
            {/* Summary Card */}
            <motion.div
              whileHover={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
              className="bg-white rounded-none shadow-xl border-t-2 border-tz-navy overflow-hidden"
            >
              {/* Summary Header */}
              <div className="bg-white p-4 sm:p-6 border-b border-gray-100">
                <h3 className="text-tz-navy font-display text-xl font-semibold flex items-center gap-2">
                  Order Summary
                </h3>
              </div>

              {/* Summary Content */}
              <div className="p-4 sm:p-6">
                {/* Coupon Input with Animation */}
                {token && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CouponInput />
                </motion.div>
                )}

                {/* Cart Total with Animation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4"
                >
                  <CartTotal />
                </motion.div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={cartData.length === 0}
                    className={`w-full bg-tz-navy text-white hover:bg-black transition-colors py-4 px-6 text-sm font-semibold tracking-wider ${
                      cartData.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    PROCEED TO CHECKOUT
                  </button>

                  {!token && cartData.length > 0 && (
                    <p className="text-center text-xs text-tz-navy/60 mt-3">
                      Sign in or create an account to complete your order. Your cart stays saved.
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure Checkout · COD & Razorpay</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 p-4 border border-gray-200 rounded-none text-xs text-gray-500 flex items-center justify-between"
            >
              <span>Need help?</span>
              <motion.a
                whileHover={{ color: '#000' }}
                href="/contact"
                className="flex items-center gap-1 hover:text-black transition-colors"
              >
                Contact Support
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.a>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {cartData.length > 0 && (
        <RecommendationRail
          endpoint="cart"
          productIds={cartData.map((item) => item._id)}
          title1="COMPLETE"
          title2="THE LOOK"
          subtitle="Pieces that go with what’s already in your cart"
          limit={8}
        />
      )}

      {/* Mobile sticky checkout — items total matches header cart */}
      {cartData.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-tz-navy/45">Cart total</p>
            <p className="text-base font-bold text-tz-navy tabular-nums">
              {formatPrice(getCartAmount())}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            className="shrink-0 bg-tz-navy text-white px-5 py-3 text-xs font-semibold tracking-wide"
          >
            CHECKOUT
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 1023px) {
          .min-h-screen { padding-bottom: 5.5rem; }
        }
      `}</style>
    </motion.div>
  )
}

export default Cart