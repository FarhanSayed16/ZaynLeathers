import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductCarousel from "./ProductCarousel";
import { dedupeProductsByStyle } from "../utils/styleListing";
import {
  productMatchesCategory,
  productMatchesDepartment,
} from "../utils/categoryMap";

/**
 * Category-scoped product carousel for the homepage (Phase B / G).
 */
const CategoryCarousel = ({
  title,
  subtitle,
  department,
  category,
  viewAllHref,
  limit = 12,
}) => {
  const { products } = useContext(ShopContext);

  const items = useMemo(() => {
    let list = products || [];
    if (department) {
      list = list.filter((p) => productMatchesDepartment(p, department));
    }
    if (category) {
      list = list.filter((p) => productMatchesCategory(p, category));
    }
    const deduped = dedupeProductsByStyle(list);
    // Never show unrelated products under a department label
    return deduped.slice(0, limit);
  }, [products, department, category, limit]);

  if (!items.length) return null;

  return (
    <ProductCarousel
      title={title}
      subtitle={subtitle}
      products={items}
      viewAllHref={
        viewAllHref ||
        (department
          ? `/shop?department=${encodeURIComponent(department)}`
          : "/shop")
      }
    />
  );
};

export default CategoryCarousel;
