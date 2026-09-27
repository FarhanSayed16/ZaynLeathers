import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "./ProductItem";
import Title from "./Title";
import { dedupeProductsByStyle } from "../utils/styleListing";

const LatestCollection = ({ title = "NEW ARRIVALS" }) => {
  const { products, settings } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    const listed = dedupeProductsByStyle(products);
    const featuredIds = settings?.homeConfig?.featuredProductIds || [];
    if (featuredIds.length > 0) {
      const featured = featuredIds
        .map((id) => listed.find((p) => p._id === id) || products.find((p) => p._id === id))
        .filter(Boolean);
      if (featured.length) {
        setLatestProducts(dedupeProductsByStyle(featured));
        return;
      }
    }
    const featuredFlag = listed.filter((p) => p.featured);
    if (featuredFlag.length) {
      setLatestProducts(featuredFlag.slice(0, 10));
      return;
    }
    const sorted = [...listed].sort((a, b) => b.date - a.date);
    setLatestProducts(sorted.slice(0, 10));
  }, [products, settings]);

  const titleParts = title.split(" ");
  const text1 = titleParts.slice(0, Math.ceil(titleParts.length / 2)).join(" ");
  const text2 = titleParts.slice(Math.ceil(titleParts.length / 2)).join(" ");

  return (
    <section className="w-full py-10 sm:py-12">
      <div className="text-center mb-7">
        <Title text1={text1} text2={text2} eyebrow="Just in" />
        <p className="text-tz-navy/50 text-sm" data-aos="fade-up" data-aos-delay="40">
          Fresh drops and featured favourites
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {latestProducts.length > 0 ? (
          latestProducts.map((item, index) => (
            <div
              key={item._id}
              data-aos="fade-up"
              data-aos-delay={Math.min((index % 5) * 60, 240)}
            >
              <ProductItem
                id={item._id}
                image={item.image}
                name={item.name}
                category={item.category || item.subCategory}
                price={item.price}
                discount={item.discount || 0}
                oldPrice={item.oldPrice || 0}
                availableQuantity={item.availableQuantity}
                imageAlt={item.imageAlt}
                priceFrom={item.priceFrom}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-tz-navy/40 py-12 text-sm">
            No products found
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestCollection;
