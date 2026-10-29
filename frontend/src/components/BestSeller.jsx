import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductCarousel from "./ProductCarousel";
import { dedupeProductsByStyle } from "../utils/styleListing";
import { isBestsellerProduct } from "../utils/categoryMap";

const BestSeller = ({ title = "Best Selling Products", subtitle = "" }) => {
  const [bestSeller, setBestSeller] = useState([]);
  const { products, productsLoading, settings } = useContext(ShopContext);

  useEffect(() => {
    const listed = dedupeProductsByStyle(products);
    const ids = settings?.homeConfig?.bestsellerProductIds || [];

    if (ids.length > 0) {
      const picked = ids
        .map((id) => listed.find((p) => p._id === id) || products.find((p) => p._id === id))
        .filter(Boolean);
      if (picked.length) {
        setBestSeller(dedupeProductsByStyle(picked).slice(0, 12));
        return;
      }
    }

    const bestProduct = listed.filter((item) => isBestsellerProduct(item));
    const list = bestProduct.length > 0 ? bestProduct : listed.slice(0, 12);
    setBestSeller(list.slice(0, 12));
  }, [products, settings]);

  return (
    <ProductCarousel
      title={title}
      subtitle={subtitle}
      products={bestSeller}
      emptyText={productsLoading && !products.length ? "Loading the collection…" : "No products yet"}
      viewAllHref="/shop"
    />
  );
};

export default BestSeller;
