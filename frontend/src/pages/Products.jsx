import React, { useContext, useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import RelatedProducts from '../components/RelatedProducts'
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa'
import { toast } from 'react-toastify'
import SimilarColorProducts from '../components/SimilarColorProducts'
import ProductAccordion from '../components/ProductAccordian'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'
import ReviewSection from '../components/ReviewSection'
import { motion, AnimatePresence } from 'framer-motion'
import brand from '../brand'
import { productGallery, productThumb } from '../utils/cloudinary'
import Breadcrumbs from '../components/Breadcrumbs'
import RecentlyViewed from '../components/RecentlyViewed'
import { pushRecentlyViewed } from '../utils/recentlyViewed'
import SEO from '../components/SEO'
import {
  getDisplayPrice,
  getDisplayOldPrice,
  getSizeQty,
  getTotalStock,
  isSizeInStock,
} from '../utils/productMatrix'

const Products = () => {
  const { productId } = useParams()
  const { products, formatPrice, addToCart, navigate } = useContext(ShopContext)
  const [productData, setProductData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [image, setImage] = useState('')
  const [size, setSize] = useState('')
  const [showAddToCartPopup, setShowAddToCartPopup] = useState(false)
  const [isImageZoomed, setIsImageZoomed] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const navigateBack = useNavigate()
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (productData && productData.image && productData.image.length > 0) {
      const currentIndex = productData.image.indexOf(image)

      if (isLeftSwipe) {
        const nextIndex = (currentIndex + 1) % productData.image.length
        setImage(productData.image[nextIndex])
      } else if (isRightSwipe) {
        const prevIndex = (currentIndex - 1 + productData.image.length) % productData.image.length
        setImage(productData.image[prevIndex])
      }
    }
  }

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true)
      setError(null)

      try {
        const foundInList = products?.find(item => item._id === productId)
        if (foundInList) {
          setProductData(foundInList)
          setImage(foundInList.image?.[0] || '')
          setSize('')
          setError(null)
          setLoading(false)
          return
        }

        const { getProduct } = await import('../api/shopApi')
        const data = await getProduct(productId)
        if (data.success && data.product) {
          setProductData(data.product)
          setImage(data.product.image?.[0] || '')
          setSize('')
          setError(null)
        } else {
          setError('Product not found')
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProductData()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [productId, products])

  useEffect(() => {
    if (productData?._id) pushRecentlyViewed(productData._id)
  }, [productData?._id])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard!')
  }

  const handleAddToCart = () => {
    if (!productData) return

    const totalStock = getTotalStock(productData)
    if (totalStock <= 0) {
      toast.error('Out of Stock')
      return
    }
    if (productData.sizes && productData.sizes.length > 0 && !size) {
      toast.warning('Please select a size')
      return
    }
    if (size && !isSizeInStock(productData, size)) {
      toast.error('Selected size is out of stock')
      return
    }
    addToCart(productData._id, size || 'Standard')
    setShowAddToCartPopup(true)

    setTimeout(() => setShowAddToCartPopup(false), 3000)
  }

  const displayPrice = productData ? getDisplayPrice(productData, size) : 0
  const displayOldPrice = productData ? getDisplayOldPrice(productData, size) : undefined
  const totalStock = productData ? getTotalStock(productData) : 0
  const selectedSizeQty = productData && size ? getSizeQty(productData, size) : totalStock

  const nextImage = () => {
    if (productData && productData.image && productData.image.length > 0) {
      const currentIndex = productData.image.indexOf(image)
      const nextIndex = (currentIndex + 1) % productData.image.length
      setImage(productData.image[nextIndex])
    }
  }

  const prevImage = () => {
    if (productData && productData.image && productData.image.length > 0) {
      const currentIndex = productData.image.indexOf(image)
      const prevIndex = (currentIndex - 1 + productData.image.length) % productData.image.length
      setImage(productData.image[prevIndex])
    }
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tz-cream">
        <div className="text-center">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 border-4 border-gray-300 border-t-black rounded-full mx-auto mb-4"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600"
          >
            Loading product...
          </motion.p>
        </div>
      </div>
    )
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tz-cream px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "The product you're looking for doesn't exist or has been removed."}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/shop')}
            className="bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 px-8 py-3 rounded-xl font-medium"
          >
            Browse Collection
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-tz-cream pb-10"
    >
      <SEO
        title={productData.seoTitle || productData.name}
        description={
          productData.description
            ? String(productData.description).slice(0, 160)
            : `${productData.name} — shop at ${brand.name}.`
        }
      />
      {/* Mobile Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between lg:hidden">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigateBack(-1)}
          className="p-1 -ml-1"
        >
          <MdKeyboardArrowLeft className="text-2xl" />
        </motion.button>
        <h1 className="font-bold text-lg tracking-tighter">{brand.shortName.toUpperCase()}</h1>
        <div className="w-8" />
      </div>

      <div className="pt-4 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20 lg:pb-0">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Shop', to: '/shop' },
            productData.department
              ? {
                  label: productData.department.replace(/-/g, ' '),
                  to: `/shop?department=${encodeURIComponent(productData.department)}`,
                }
              : null,
            { label: productData.name },
          ].filter(Boolean)}
        />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className='flex flex-col lg:flex-row gap-6 lg:gap-10'
        >
          {/* Product Images Section */}
          <motion.div variants={itemVariants} className='flex-1'>
            <div className='flex flex-col-reverse lg:flex-row gap-3'>
              {/* Thumbnail Images - Horizontal scroll on mobile, vertical on desktop */}
              {productData.image && productData.image.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className='flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 no-scrollbar'
                  style={{ maxHeight: '500px' }}
                >
                  {productData.image.map((item, index) => (
                    <img
                      key={item || index}
                      onClick={() => setImage(item)}
                      src={productThumb(item)}
                      alt={productData.imageAlt || `Product view ${index + 1}`}
                      width={80}
                      height={80}
                      loading="lazy"
                      decoding="async"
                      className={`w-16 h-16 lg:w-20 lg:h-20 object-cover rounded-xl cursor-pointer border-2 transition-all duration-300 flex-shrink-0 hover:scale-105 ${
                        image === item ? 'border-black shadow-lg' : 'border-transparent hover:border-gray-300'
                      }`}
                    />
                  ))}
                </motion.div>
              )}

              {/* Main Image with Swipe Functionality */}
              <motion.div
                variants={itemVariants}
                className='relative flex-1 mt-6 overflow-hidden rounded-2xl bg-gray-100'
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <motion.img
                  key={image}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: isImageZoomed ? 1.5 : 1 }}
                  transition={{ duration: 0.25 }}
                  src={productGallery(image || productData.image?.[0])}
                  alt={productData.imageAlt || productData.name}
                  width={900}
                  height={1100}
                  decoding="async"
                  className={`w-full h-auto cursor-${isImageZoomed ? 'zoom-out' : 'zoom-in'} transition-all duration-300 rounded-2xl`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsImageZoomed(!isImageZoomed)
                  }}
                />

                {/* Navigation Arrows for Mobile */}
                {productData.image && productData.image.length > 1 && !isImageZoomed && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all lg:hidden"
                    >
                      <MdKeyboardArrowLeft className="text-xl" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all lg:hidden"
                    >
                      <MdKeyboardArrowRight className="text-xl" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {productData.image && productData.image.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    {productData.image.indexOf(image) + 1} / {productData.image.length}
                  </div>
                )}

                {/* Zoom Hint */}
                {!isImageZoomed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    className="hidden lg:block absolute bottom-4 right-4 bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 p-2 rounded-full text-xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </motion.div>
                )}

                {/* Swipe Hint for Mobile */}
                {productData.image && productData.image.length > 1 && !isImageZoomed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:hidden absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Swipe</span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Product Information */}
          <motion.div variants={itemVariants} className='flex-1 space-y-5'>
            {/* Category and Name */}
            <div>
              <motion.p variants={itemVariants} className='text-sm text-gray-500 uppercase tracking-wider'>
                {productData.subCategory || 'Category'}
              </motion.p>
              <h1 className='font-bold text-2xl lg:text-3xl text-gray-800 mt-1 leading-tight'>
                {productData.name}
              </h1>
            </div>

            {/* Price */}
            <motion.div variants={itemVariants} className='flex items-baseline gap-3'>
              <span className="text-[26px] font-bold text-tz-navy">
                {formatPrice(displayPrice)}
              </span>
              {displayOldPrice && (
                <span className="text-[17px] text-tz-navy/40 line-through">
                  {formatPrice(displayOldPrice)}
                </span>
              )}
              {displayOldPrice && (
                <div className="bg-tz-pink/10 text-tz-pink px-2.5 py-1 rounded-md text-[13px] font-semibold tracking-wide border border-tz-pink/20">
                  Save {formatPrice(displayOldPrice - displayPrice)}
                </div>
              )}
            </motion.div>

            {/* Colors Available - Mobile */}
            {productData.parentId && (
              <motion.div variants={itemVariants} className='lg:hidden'>
                <p className='text-sm font-medium mb-2'>Colors available</p>
                <SimilarColorProducts parentId={productData.parentId} currentProductId={productData._id} />
              </motion.div>
            )}

            {/* Material & details */}
            {(productData.material || productData.dimensions || productData.department) && (
              <motion.div variants={itemVariants} className="border border-tz-pink/15 bg-tz-cream/60 px-4 py-3 space-y-1.5">
                {productData.department && (
                  <p className="text-xs text-tz-navy/70">
                    <span className="font-semibold text-tz-navy uppercase tracking-wider text-[10px]">Department</span>
                    <span className="ml-2 capitalize">{productData.department.replace(/-/g, " ")}</span>
                    {productData.category ? <span className="text-tz-navy/40"> · {productData.category}</span> : null}
                  </p>
                )}
                {productData.material && (
                  <p className="text-xs text-tz-navy/70">
                    <span className="font-semibold text-tz-navy uppercase tracking-wider text-[10px]">Material</span>
                    <span className="ml-2">{productData.material}</span>
                  </p>
                )}
                {productData.dimensions && (
                  <p className="text-xs text-tz-navy/70">
                    <span className="font-semibold text-tz-navy uppercase tracking-wider text-[10px]">Dimensions</span>
                    <span className="ml-2">{productData.dimensions}</span>
                  </p>
                )}
                {productData.gender && (
                  <p className="text-xs text-tz-navy/70">
                    <span className="font-semibold text-tz-navy uppercase tracking-wider text-[10px]">Fit</span>
                    <span className="ml-2 capitalize">{productData.gender}</span>
                  </p>
                )}
              </motion.div>
            )}

            {/* Size Selection */}
            {productData.sizes && productData.sizes.length > 0 && (
              <motion.div variants={itemVariants} className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <p className='font-medium text-sm'>Select Size</p>
                  <span className="text-[11px] text-tz-navy/45">
                    {productData.department === 'bags' ? 'See size / capacity below' : 'True to size for leather'}
                  </span>
                </div>

                <div className='flex flex-wrap gap-2'>
                  {productData.sizes.map((item, index) => {
                    const oos = !isSizeInStock(productData, item)
                    return (
                    <motion.button
                      key={index}
                      whileHover={oos ? {} : { scale: 1.03 }}
                      whileTap={oos ? {} : { scale: 0.97 }}
                      onClick={() => !oos && setSize(item)}
                      disabled={oos}
                      className={`min-w-[60px] px-4 py-2.5 rounded-xl border-2 transition-all duration-300 text-sm font-medium ${
                        oos
                          ? 'bg-gray-50 border-gray-200 text-gray-400 line-through cursor-not-allowed'
                          : item === size
                          ? 'bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 border-black shadow-md'
                          : 'bg-gray-100 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {item}
                    </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Colors Available - Desktop */}
            {productData.parentId && (
              <motion.div variants={itemVariants} className='hidden lg:block'>
                <p className='font-medium mb-2'>Colors available</p>
                <SimilarColorProducts parentId={productData.parentId} currentProductId={productData._id} />
              </motion.div>
            )}

            {/* Stock Status */}
            <motion.div variants={itemVariants}>
              {totalStock > 0 ? (
                <div className='flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-flex'>
                  <span className='w-2 h-2 bg-green-600 rounded-full animate-pulse'></span>
                  In Stock ({size ? `${selectedSizeQty} in ${size}` : `${totalStock} available`})
                </div>
              ) : (
                <div className='flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg inline-flex'>
                  <span className='w-2 h-2 bg-red-600 rounded-full animate-pulse'></span>
                  Out of Stock
                </div>
              )}
            </motion.div>

            {/* Add to Cart Button */}
            <motion.div variants={itemVariants} className='pt-2'>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={totalStock <= 0 || (size && !isSizeInStock(productData, size))}
                className={`w-full py-4 rounded-xl text-sm font-semibold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                  totalStock <= 0 || (size && !isSizeInStock(productData, size))
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 hover:bg-gray-800 shadow-lg hover:shadow-xl'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalStock <= 0 ? "SOLD OUT" : "ADD TO CART"}
              </motion.button>
              <p className="text-[11px] text-tz-navy/50 text-center">
                Cash on delivery · Easy 7-day returns · Free shipping above {formatPrice(999)}
              </p>
            </motion.div>

            {/* Share Section */}
            <motion.div variants={itemVariants} className='pt-2'>
              <p className='text-xs font-medium text-gray-500 mb-3'>Share this product</p>
              <div className='flex gap-4 items-center'>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="text-xs font-semibold underline text-tz-navy/70"
                >
                  Copy link
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${productData.name} ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-500"
                  aria-label="Share on WhatsApp"
                >
                  <FaWhatsapp size={18} />
                </a>
                {brand.social?.facebook ? (
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600"
                    aria-label="Share on Facebook"
                  >
                    <FaFacebookF size={18} />
                  </a>
                ) : null}
                {brand.social?.instagram ? (
                  <a
                    href={brand.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-pink-500"
                    aria-label="Zayn Leathers on Instagram"
                  >
                    <FaInstagram size={18} />
                  </a>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Product Accordions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className='mt-8'
        >
          {productData.description && (
            <ProductAccordion title="DESCRIPTION / DETAILS">
              <motion.div variants={itemVariants} className="space-y-2">
                {productData.description
                  .split('.')
                  .filter(sentence => sentence.trim().length > 0)
                  .map((sentence, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className='text-gray-600 text-sm'
                    >
                      • {sentence.trim()}.
                    </motion.p>
                  ))}
              </motion.div>
            </ProductAccordion>
          )}

          <ProductAccordion title="SIZE GUIDE">
            <motion.div variants={itemVariants} className="space-y-2 text-sm text-gray-600">
              {productData.department === 'bags' ? (
                <>
                  <p>Bag sizes are listed as approximate outer dimensions on the product (H × W × D).</p>
                  <p>Laptop bags: match the listed laptop size. Crossbody and slings fit daily essentials, not a 15" laptop unless stated.</p>
                  <p>If you need help choosing, WhatsApp us with the product name after we publish a contact number.</p>
                </>
              ) : productData.department === 'accessories' ? (
                <>
                  <p>Belts: measure your usual waist over trousers, or pick the size that matches your jean waist.</p>
                  <p>Wallets: one size unless noted. Card slots are standard RFID-ready where specified.</p>
                </>
              ) : (
                <>
                  <p>Leather jackets are cut true to size. If you are between sizes, size up for a layer underneath.</p>
                  <p>Chest: measure around the fullest part. Compare with the size chart on the garment label when delivered.</p>
                  <p>Indian sizes: S 36–38" chest · M 38–40" · L 40–42" · XL 42–44" · XXL 44–46" (approx.).</p>
                </>
              )}
            </motion.div>
          </ProductAccordion>

          <ProductAccordion title="RETURNS & EXCHANGE">
            <motion.div variants={itemVariants} className="space-y-2">
              {[
                "100% Original Product",
                "Cash on Delivery is available on this product",
                "Easy Return Policy within 7 days",
                `Free shipping on orders above ${formatPrice(999)}`
              ].map((text, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className='flex items-center gap-2 text-gray-600 text-sm'
                >
                  <span className='w-1.5 h-1.5 bg-black rounded-full'></span>
                  {text}
                </motion.p>
              ))}
            </motion.div>
          </ProductAccordion>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className='mt-8'
        >
          <ReviewSection productId={productData._id} />
        </motion.div>

        {/* Related Products */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className='mt-10'
        >
          <RelatedProducts
            productId={productData._id}
          />
        </motion.div>

        <RecentlyViewed excludeId={productData._id} />
      </div>

      {totalStock > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-tz-pink/20 px-4 py-3 flex items-center gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{productData.name}</p>
            <p className="text-xs text-tz-navy/55">
              {formatPrice(displayPrice)}
              {productData.sizes?.length ? ` · ${size || 'Select size'}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className="shrink-0 bg-tz-navy text-white px-4 py-2.5 rounded-xl text-xs font-semibold"
          >
            ADD TO CART
          </button>
        </div>
      )}

      {/* Add to Cart Success Popup */}
      <AnimatePresence>
        {showAddToCartPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 lg:bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-sm"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-4 border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Added to Cart!</p>
                  <p className="text-xs text-gray-500">{productData.name} - Size {size}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/cart')}
                  className="bg-tz-navy text-white hover:bg-tz-pink hover:text-white transition-colors duration-300 px-4 py-2 rounded-lg text-xs font-medium"
                >
                  View Cart
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

export default Products