import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { toast } from "react-toastify";
import brand from "../brand";
import { productThumb } from "../utils/cloudinary";

const WishListProductItem = ({ id, image, name, price, discount, oldPrice }) => {
  const {
    formatPrice,
    addToWishlist,
    wishlistItems,
    updateUserWishlist,
    addToCart,
  } = useContext(ShopContext);
  const [isLiked, setIsLiked] = useState(wishlistItems.includes(id));
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setIsLiked(wishlistItems.includes(id));
  }, [wishlistItems, id]);

  const truncateByWord = (str, limit) => {
    if (!str) return "";
    if (str.length <= limit) return str;
    const trimmedStr = str.substring(0, limit);
    const lastSpaceIndex = trimmedStr.lastIndexOf(" ");
    return trimmedStr.substring(0, lastSpaceIndex > 0 ? lastSpaceIndex : limit) + "...";
  };

  const handleLikeToggle = async () => {
    if (!isLiked) {
      const ok = await addToWishlist(id);
      if (ok) setIsLiked(true);
    } else {
      const ok = await updateUserWishlist(id);
      if (ok) setIsLiked(false);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(id, "Standard");
    toast.success("Added to cart!");
  };

  const src = imageError
    ? brand.media.placeholder
    : productThumb(image?.[0] || brand.media.placeholder);

  return (
    <div className="relative">
      {discount > 0 && (
        <span className="absolute top-2 left-2 z-10 bg-green-100 text-green-600 text-[8px] xl:text-xs font-semibold px-2 py-1 rounded">
          {discount}% off
        </span>
      )}

      <button
        type="button"
        className="absolute top-2 right-2 z-10 text-gray-500 cursor-pointer"
        onClick={handleLikeToggle}
        aria-label="Toggle wishlist"
      >
        {isLiked ? (
          <FaHeart className="text-red-500 text-lg xl:text-xl" />
        ) : (
          <FaRegHeart className="text-xl xl:text-xl" />
        )}
      </button>

      <Link className="text-gray-700 cursor-pointer" to={`/product/${id}`}>
        <div className="overflow-hidden aspect-square bg-gray-50">
          <img
            src={src}
            className="w-full h-full object-cover"
            alt={name}
            width={320}
            height={320}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
          />
        </div>

        <p className="text-xs xl:text-sm pt-1 px-2">{truncateByWord(name, 25)}</p>
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-sm font-medium">
            {formatPrice(price)}{" "}
            {oldPrice > 0 && (
              <span className="text-gray-400 line-through text-sm pl-2">
                {formatPrice(oldPrice)}
              </span>
            )}
          </p>
        </div>
      </Link>

      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full bg-tz-navy text-white hover:bg-tz-pink transition-colors py-1.5 text-xs font-semibold rounded"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default WishListProductItem;
