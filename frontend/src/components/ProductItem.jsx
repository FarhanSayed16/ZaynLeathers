import React, { memo, useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import brand from "../brand";
import { productThumb } from "../utils/cloudinary";

const ProductItem = ({ id, image, name, price, discount, oldPrice, availableQuantity, imageAlt, priceFrom = false }) => {
  const { formatPrice, addToWishlist, wishlistItems, updateUserWishlist } =
    useContext(ShopContext);

  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const finalDiscount =
    discount ||
    (oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);

  useEffect(() => {
    setIsLiked(wishlistItems.includes(id));
  }, [wishlistItems, id]);

  const handleLikeToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLiked) {
      const success = await addToWishlist(id);
      if (success) setIsLiked(true);
    } else {
      const success = await updateUserWishlist(id);
      if (success) setIsLiked(false);
    }
  };

  const truncateByWord = (str, limit) => {
    if (!str) return "";
    if (str.length <= limit) return str;
    return str.substring(0, limit).trim() + "...";
  };

  const primarySrc = imageError
    ? brand.media.placeholder
    : productThumb(
        (isHovered && image?.length > 1 ? image[1] : image?.[0]) ||
          brand.media.placeholder
      );

  return (
    <div
      className="relative group h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/product/${id}`}
        className="flex flex-col h-full bg-brand-surface overflow-hidden transition-all duration-500 relative border border-transparent hover:border-tz-pink/25"
      >
        <div className="relative bg-tz-cream overflow-hidden aspect-[3/4] w-full">
          <img
            src={primarySrc}
            alt={imageAlt || name}
            width={480}
            height={640}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            onError={() => setImageError(true)}
            loading="lazy"
            decoding="async"
          />

          {Number(availableQuantity) === 0 && (
            <div className="absolute inset-0 bg-white/55 z-10 flex items-end justify-center pb-3">
              <span className="bg-tz-navy text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1">
                Sold out
              </span>
            </div>
          )}

          {finalDiscount > 0 && (
            <div className="absolute top-0 left-0 z-10">
              <div className="bg-tz-navy text-white font-semibold text-[10px] px-2.5 py-1 tracking-wider">
                −{finalDiscount}%
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLikeToggle}
            aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-2.5 right-2.5 z-20 bg-white/90 p-2 border border-tz-navy/5 hover:bg-white transition-colors"
          >
            {isLiked ? (
              <FaHeart size={13} className="text-tz-pink" />
            ) : (
              <FaRegHeart size={13} className="text-tz-navy/60" />
            )}
          </button>

          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10 pointer-events-none">
            <span className="block w-full text-center bg-tz-navy/90 text-white text-[11px] font-semibold tracking-[0.14em] uppercase py-2.5">
              View
            </span>
          </div>
        </div>

        <div className="px-1 pt-3 pb-2 flex-1 flex flex-col">
          <h3 className="text-[13px] font-medium text-tz-navy leading-snug line-clamp-2 min-h-[2.4rem]">
            {truncateByWord(name, 52)}
          </h3>

          <div className="mt-auto pt-1.5 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-tz-navy">
              {priceFrom && price > 0 ? `From ${formatPrice(price)}` : formatPrice(price)}
            </span>
            {oldPrice > price && (
              <span className="text-[11px] text-tz-navy/35 line-through">
                {formatPrice(oldPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default memo(ProductItem);
