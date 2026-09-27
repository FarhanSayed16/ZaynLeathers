import React from "react";
import { Link } from "react-router-dom";

const SimilarColorProductItem = ({ id, image, color, isCurrent }) => {
  return (
    <Link
      className={`bg-white shadow-md rounded-lg overflow-hidden block ${
        isCurrent ? "ring-2 ring-tz-navy" : ""
      }`}
      to={`/product/${id}`}
      title={color || "View colour"}
    >
      <div className="overflow-hidden">
        <img
          src={image?.[0]}
          alt={color || "Colour variant"}
          className="w-20 sm:w-14 md:w-12 xl:w-14 object-contain mx-auto"
        />
      </div>
    </Link>
  );
};

export default SimilarColorProductItem;
