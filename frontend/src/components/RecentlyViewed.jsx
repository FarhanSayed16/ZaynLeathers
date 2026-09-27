import { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "./ProductItem";
import Title from "./Title";
import { readRecentlyViewed } from "../utils/recentlyViewed";
import { dedupeProductsByStyle } from "../utils/styleListing";

const RecentlyViewed = ({ excludeId }) => {
  const { products } = useContext(ShopContext);
  const items = useMemo(() => {
    const ids = readRecentlyViewed().filter((id) => id !== String(excludeId || ""));
    return dedupeProductsByStyle(
      ids.map((id) => products.find((p) => String(p._id) === id)).filter(Boolean)
    ).slice(0, 5);
  }, [products, excludeId]);

  if (items.length < 2) return null;

  return (
    <section className="mt-12 pb-8">
      <Title text1="RECENTLY" text2="VIEWED" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mt-4">
        {items.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
            discount={item.discount}
            oldPrice={item.oldPrice}
            availableQuantity={item.availableQuantity}
            imageAlt={item.imageAlt}
            priceFrom={item.priceFrom}
          />
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
