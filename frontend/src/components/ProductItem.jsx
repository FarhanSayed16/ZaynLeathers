import React, { memo, useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import brand from "../brand";
import { productThumb } from "../utils/cloudinary";

/**
 * Phase B product card — clean retail look:
 * large image, centered title + price (reference PLP style).
 */
const ProductItem = ({
  id,
  image,
  name,
  price,
  discount,
  oldPrice,
  availableQuantity,
  imageAlt,
  priceFrom = false,
}) => {
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
      <Link to={`/product/${id}`} className="flex flex-col h-full bg-white overflow-hidden">
        <div className="relative bg-gray-50 overflow-hidden aspect-[3/4] w-full">
          <img
            src={primarySrc}
            alt={imageAlt || name}
            width={480}
            height={640}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
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
            className="absolute top-2.5 right-2.5 z-20 bg-white/95 p-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-sm"
          >
            {isLiked ? (
              <FaHeart size={13} className="text-tz-pink" />
            ) : (
              <FaRegHeart size={13} className="text-tz-navy/60" />
            )}
          </button>
        </div>

        <div className="px-2 pt-3.5 pb-2 flex-1 flex flex-col items-center text-center">
          <h3 className="text-[13px] sm:text-sm font-medium text-tz-navy leading-snug line-clamp-2 min-h-[2.5rem]">
            {truncateByWord(name, 56)}
          </h3>

          <div className="mt-2 flex items-baseline justify-center gap-2">
            <span className="text-[15px] font-bold text-tz-navy tabular-nums">
              {priceFrom && price > 0 ? `From ${formatPrice(price)}` : formatPrice(price)}
            </span>
            {oldPrice > price && (
              <span className="text-xs text-tz-navy/35 line-through tabular-nums">
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
