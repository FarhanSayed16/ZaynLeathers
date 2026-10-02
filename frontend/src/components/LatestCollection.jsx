import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductCarousel from "./ProductCarousel";
import { dedupeProductsByStyle } from "../utils/styleListing";
import { isNewArrivalProduct } from "../utils/categoryMap";

const LatestCollection = ({ title = "New Arrivals" }) => {
  const { products, settings } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    const listed = dedupeProductsByStyle(products);
    const ids = settings?.homeConfig?.newArrivalProductIds || [];

    if (ids.length > 0) {
      const picked = ids
        .map((id) => listed.find((p) => p._id === id) || products.find((p) => p._id === id))
        .filter(Boolean);
      if (picked.length) {
        setLatestProducts(dedupeProductsByStyle(picked).slice(0, 12));
        return;
      }
    }

    const tagged = listed.filter((p) => isNewArrivalProduct(p));
    if (tagged.length) {
      setLatestProducts(tagged.slice(0, 12));
      return;
    }

    const sorted = [...listed].sort((a, b) => {
      const da = new Date(a.date || 0).getTime();
      const db = new Date(b.date || 0).getTime();
      return db - da;
    });
    setLatestProducts(sorted.slice(0, 12));
  }, [products, settings]);

  return (
    <ProductCarousel
      title={title}
      subtitle="Fresh drops and latest leather pieces"
      products={latestProducts}
      viewAllHref="/shop?sort=newest"
      emptyText="No new arrivals yet"
    />
  );
};

export default LatestCollection;
