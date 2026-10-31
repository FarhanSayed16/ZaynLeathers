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
import { plainProductText, productCopyBlocks } from '../utils/productCopy'

const Products = () => {
  const { productId } = useParams()
  const { products, formatPrice, addToCart, navigate } = useContext(ShopContext)
  const [productData, setProductData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [image, setImage] = useState('')
  const [frameRatio, setFrameRatio] = useState(4 / 5)
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
          if (foundInList.type === 'variable') {
            const { getProduct } = await import('../api/shopApi')
            const data = await getProduct(productId)
            if (data.success && data.product && String(data.product._id) === String(productId)) {
              setProductData(data.product)
            }
          }
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
    addToCart(productData._id, size || 'Standard', { silent: true })
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

  const copyBlocks = productCopyBlocks(productData.description, productData.name)
  const pretty = (value) =>
    String(value || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  const categoryLabel = productData.category ? pretty(productData.category) : ""
  const departmentLabel = productData.department ? pretty(productData.department) : ""
  const factRows = [
    departmentLabel
      ? ["Department", categoryLabel && categoryLabel.toLowerCase() !== departmentLabel.toLowerCase() ? `${departmentLabel} · ${categoryLabel}` : departmentLabel]
      : null,
    productData.material ? ["Material", productData.material] : null,
    typeof productData.dimensions === "string" && productData.dimensions ? ["Dimensions", productData.dimensions] : null,
  ].filter(Boolean)
  const detailRows = [
    productData.sku ? ["SKU", productData.sku] : null,
    productData.color ? ["Colour", productData.color] : null,
    productData.material ? ["Material", productData.material] : null,
    productData.sizes?.length ? ["Sizes", productData.sizes.join(", ")] : null,
  ].filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-tz-cream pb-28 lg:pb-10"
    >
      <SEO
        title={productData.seoTitle || productData.name}
        description={
          plainProductText(productData.description, productData.name).slice(0, 160)
          || `${productData.name} — shop at ${brand.name}.`
        }
      />
      <div className="pt-3 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24 lg:pb-0">
        <button
          type="button"
          onClick={() => navigateBack(-1)}
          className="lg:hidden mb-3 inline-flex items-center gap-0.5 text-sm font-medium text-tz-navy/70"
        >
          <MdKeyboardArrowLeft className="text-2xl -ml-1" />
          Back
        </button>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className='flex flex-col lg:flex-row gap-6 lg:gap-10'
        >
          {/* Product Images Section */}
          <motion.div variants={itemVariants} className='flex-1 min-w-0 lg:sticky lg:top-24 lg:self-start'>
            <div className='flex flex-col gap-3'>
              <div
                className='relative overflow-hidden bg-[#f3f1ee]'
                style={{ aspectRatio: frameRatio }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img
                  key={image}
                  src={productGallery(image || productData.image?.[0])}
                  alt={productData.imageAlt || productData.name}
                  width={900}
                  height={1100}
                  decoding="async"
                  className={`w-full h-full object-contain transition-transform duration-300 ${
                    isImageZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  onLoad={(event) => {
                    const { naturalWidth, naturalHeight } = event.currentTarget
                    if (!naturalWidth || !naturalHeight) return
                    const ratio = naturalWidth / naturalHeight
                    setFrameRatio(Math.min(1.9, Math.max(0.72, ratio)))
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsImageZoomed(!isImageZoomed)
                  }}
                />

                {productData.image && productData.image.length > 1 && !isImageZoomed && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-tz-navy p-2 shadow-sm transition-colors lg:hidden"
                    >
                      <MdKeyboardArrowLeft className="text-xl" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-tz-navy p-2 shadow-sm transition-colors lg:hidden"
                    >
                      <MdKeyboardArrowRight className="text-xl" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-tz-navy/80 text-white px-2.5 py-0.5 text-[11px] tracking-wide tabular-nums">
                      {productData.image.indexOf(image) + 1} / {productData.image.length}
                    </div>
                  </>
                )}
              </div>
              {productData.image && productData.image.length > 0 && (
                <div
                  className='flex gap-2 overflow-x-auto no-scrollbar pb-1'
                  role="listbox"
                  aria-label="Product images"
                >
                  {productData.image.map((item, index) => (
                    <button
                      key={item || index}
                      type="button"
                      role="option"
                      aria-selected={image === item}
                      onClick={() => setImage(item)}
                      className={`shrink-0 border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tz-navy ${
                        image === item
                          ? 'border-tz-navy'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={productThumb(item)}
                        alt={productData.imageAlt || `Product view ${index + 1}`}
                        width={80}
                        height={80}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-16 lg:w-[72px] lg:h-[72px] object-contain bg-[#f3f1ee] block"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Sticky buy box */}
          <motion.div
            variants={itemVariants}
            className='flex-1 min-w-0 space-y-5'
          >
            {/* Category and Name */}
            <div className="text-center sm:text-left">
              <motion.p variants={itemVariants} className='text-sm text-gray-500 uppercase tracking-wider'>
                {productData.subCategory || 'Category'}
              </motion.p>
              <h1 className='font-bold text-2xl lg:text-3xl text-gray-800 mt-1 leading-tight'>
                {productData.name}
              </h1>
            </div>

            {/* Price */}
            <motion.div variants={itemVariants} className='flex flex-wrap items-baseline justify-center sm:justify-start gap-3'>
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

            {factRows.length > 0 && (
              <dl className="flex flex-wrap justify-center sm:justify-start gap-x-8 gap-y-3 text-center sm:text-left">
                {factRows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-tz-navy/40">{label}</dt>
                    <dd className="mt-1 text-sm text-tz-navy">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Size Selection */}
            {productData.sizes && productData.sizes.length > 0 && (
              <div className='space-y-3'>
                <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
                  <p className='font-semibold text-sm text-tz-navy'>
                    Size
                    {size ? (
                      <span className="ml-2 font-normal text-tz-navy/55">· {size}</span>
                    ) : (
                      <span className="ml-2 font-normal text-tz-pink">Select one</span>
                    )}
                  </p>
                  <span className="text-xs text-tz-navy/50 leading-relaxed">
                    {productData.department === 'bags' ? 'See size / capacity below' : 'True to size for leather'}
                  </span>
                </div>

                <div className='flex flex-wrap gap-2' role="group" aria-label="Select size">
                  {productData.sizes.map((item, index) => {
                    const oos = !isSizeInStock(productData, item)
                    return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => !oos && setSize(item)}
                      disabled={oos}
                      aria-pressed={item === size}
                      className={`min-w-[56px] px-3.5 py-2.5 border text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tz-navy focus-visible:ring-offset-1 ${
                        oos
                          ? 'bg-gray-50 border-gray-200 text-gray-400 line-through cursor-not-allowed'
                          : item === size
                          ? 'bg-tz-navy text-white border-tz-navy'
                          : 'bg-white border-gray-300 text-tz-navy hover:border-tz-navy'
                      }`}
                    >
                      {item}
                    </button>
                    )
                  })}
                </div>
              </div>
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

            {/* Add to Cart + custom fit */}
            <div className='pt-1 space-y-3'>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={totalStock <= 0 || (size && !isSizeInStock(productData, size))}
                className={`w-full py-4 text-sm font-semibold tracking-wider transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-tz-navy ${
                  totalStock <= 0 || (size && !isSizeInStock(productData, size))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-tz-navy text-white hover:bg-black'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalStock <= 0 ? "SOLD OUT" : "ADD TO CART"}
              </button>
              <div className="grid sm:grid-cols-2 gap-2">
                <Link
                  to="/custom-jackets"
                  className="flex items-center justify-between gap-3 border border-tz-navy/15 bg-white px-4 py-3 text-left"
                >
                  <span>
                    <span className="block text-sm font-semibold text-tz-navy">Need a custom fit?</span>
                    <span className="mt-0.5 block text-xs text-tz-navy/55">We cut it to your measurements</span>
                  </span>
                  <span aria-hidden className="text-tz-navy/40">→</span>
                </Link>
                {brand.contact.whatsappUrl ? (
                  <a
                    href={`${brand.contact.whatsappUrl}?text=${encodeURIComponent(`Hi, I have a question about ${productData.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 border border-[#128C7E]/25 bg-[#128C7E]/[0.06] px-4 py-3 text-left"
                  >
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-tz-navy">
                        <FaWhatsapp className="text-[#128C7E]" size={15} />
                        Chat on WhatsApp
                      </span>
                      <span className="mt-0.5 block text-xs text-tz-navy/55">{brand.contact.whatsapp}</span>
                    </span>
                    <span aria-hidden className="text-tz-navy/40">→</span>
                  </a>
                ) : null}
              </div>
              <p className="text-xs text-tz-navy/50 text-center">
                Cash on delivery · 30-day returns · Free shipping worldwide
              </p>
            </div>

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

            {detailRows.length > 0 && (
              <section className="border border-tz-navy/10 bg-white">
                <h2 className="px-4 pt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-tz-navy/45">
                  Details
                </h2>
                <dl className="mt-2">
                  {detailRows.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-3 border-t border-tz-navy/10">
                      <dt className="text-xs text-tz-navy/45 pt-0.5">{label}</dt>
                      <dd className="text-sm text-tz-navy leading-relaxed">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <div className="border-t border-tz-navy/10">
              <ProductAccordion title="Description" defaultOpen>
                <div className="space-y-3 text-[15px] leading-7 text-tz-navy/85">
                  {copyBlocks.map((block, index) =>
                    block.type === "ul" ? (
                      <ul key={index} className="space-y-1.5">
                        {block.items.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-tz-navy/40" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p key={index}>{block.text}</p>
                    )
                  )}
                </div>
              </ProductAccordion>

              <ProductAccordion title="Size guide">
                {productData.department === "bags" ? (
                  <div className="space-y-2">
                    <p>Bag sizes are listed as approximate outer dimensions on the product (H × W × D).</p>
                    <p>Laptop bags: match the listed laptop size. Crossbody and slings fit daily essentials, not a 15" laptop unless stated.</p>
                  </div>
                ) : productData.department === "accessories" ? (
                  <div className="space-y-2">
                    <p>Belts: measure your usual waist over trousers, or pick the size that matches your jean waist.</p>
                    <p>Wallets: one size unless noted.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p>Measure around the fullest part of the chest. Jackets are cut true to size. Between sizes, choose the larger one if you want a layer underneath.</p>
                    <div className="overflow-hidden border border-tz-navy/10 bg-white">
                      <div className="grid grid-cols-2 bg-[#f7f4ef] text-[11px] font-semibold uppercase tracking-[0.12em] text-tz-navy/45">
                        <div className="px-3 py-2">Size</div>
                        <div className="px-3 py-2">Chest</div>
                      </div>
                      {[
                        ["S", "36–38 in"],
                        ["M", "38–40 in"],
                        ["L", "40–42 in"],
                        ["XL", "42–44 in"],
                        ["2XL", "44–46 in"],
                      ].map(([sizeLabel, chest]) => (
                        <div key={sizeLabel} className="grid grid-cols-2 border-t border-tz-navy/10 text-sm">
                          <div className="px-3 py-2.5 font-semibold text-tz-navy">{sizeLabel}</div>
                          <div className="px-3 py-2.5 text-tz-navy/80">{chest}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-tz-navy/60">3XL is cut larger than 2XL. The photos on this page also include the maker’s chart.</p>
                  </div>
                )}
              </ProductAccordion>

              <ProductAccordion title="Returns & exchange">
                <ul className="space-y-1.5">
                  {[
                    "Handcrafted genuine leather, inspected before dispatch",
                    "Free expedited shipping worldwide",
                    "Returns accepted within 30 days of delivery",
                    "30-day warranty on manufacturing defects",
                  ].map((text) => (
                    <li key={text} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-tz-navy/40" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </ProductAccordion>
            </div>
          </motion.div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className='mt-8'
        >
          <ReviewSection productId={productData._id} sku={productData.sku} />
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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-tz-navy">{productData.name}</p>
            <p className="text-xs text-tz-navy/55 mt-0.5">
              {formatPrice(displayPrice)}
              {productData.sizes?.length ? ` · ${size || 'Select size'}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className="shrink-0 bg-tz-navy text-white px-4 py-3 text-xs font-semibold tracking-wide"
          >
            ADD TO CART
          </button>
        </div>
      )}

      <AnimatePresence>
        {showAddToCartPopup && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed z-[60] left-3 right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:left-auto lg:right-6 lg:bottom-6 lg:w-[22rem]"
          >
            <div className="bg-white shadow-2xl border border-tz-navy/10 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 shrink-0 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-tz-navy">Added to cart</p>
                  <p className="text-xs text-tz-navy/60 mt-1 leading-relaxed line-clamp-2">
                    {productData.name}{size ? ` · Size ${size}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="mt-3 w-full bg-tz-navy text-white py-2.5 text-xs font-semibold tracking-wide"
              >
                View cart
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

export default Products