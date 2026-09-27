import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { isWooMode } from "../api/mode";

const RecommendationRail = ({
  productId,
  productIds,
  recentlyViewedIds,
  title1 = "YOU MAY",
  title2 = "ALSO LIKE",
  subtitle,
  limit = 10,
  endpoint = "product",
}) => {
  const { backendUrl, settings } = useContext(ShopContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const enabled = !isWooMode && settings?.features?.recommendations !== false;

  const productIdsKey = (productIds || []).join(",");
  const viewedKey = (recentlyViewedIds || []).join(",");

  useEffect(() => {
    if (!enabled || !backendUrl) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const seedIds = [
      productId,
      ...(productIdsKey ? productIdsKey.split(",") : []),
      ...(viewedKey ? viewedKey.split(",") : []),
    ]
      .map(String)
      .filter(Boolean);

    let cancelled = false;

    const run = async () => {
      try {
        let products = [];
        if (endpoint === "cart" && seedIds.length) {
          const res = await axios.post(`${backendUrl}/api/product/recommendations/cart`, {
            productIds: seedIds,
            limit,
          });
          if (res.data?.enabled === false) return;
          products = res.data?.products || [];
        } else if (endpoint === "discover") {
          const res = await axios.get(`${backendUrl}/api/product/recommendations/discover`, {
            params: { ids: seedIds.join(","), limit },
          });
          if (res.data?.enabled === false) return;
          products = res.data?.products || [];
        } else if (productId) {
          const res = await axios.get(`${backendUrl}/api/product/recommendations`, {
            params: { productId, limit },
          });
          if (res.data?.enabled === false) return;
          products = res.data?.products || [];
        }
        if (!cancelled) setItems(products);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled, backendUrl, productId, productIdsKey, viewedKey, limit, endpoint]);

  if (!enabled) return null;
  if (loading) {
    return (
      <section className="mt-10 mb-8">
        <div className="h-8 w-48 bg-tz-navy/10 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="aspect-[3/4] bg-tz-navy/5 rounded animate-pulse" />
          ))}
        </div>
      </section>
    );
  }
  if (items.length < 1) return null;

  return (
    <section className="mt-10 mb-8">
      <div className="text-2xl md:text-3xl py-2">
        <Title text1={title1} text2={title2} />
      </div>
      {subtitle ? <p className="text-sm text-tz-navy/50 mb-3">{subtitle}</p> : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mt-3">
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
          />
        ))}
      </div>
    </section>
  );
};

export default RecommendationRail;
