import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import Title from "./Title";
import brand from "../brand";
import { ShopContext } from "../context/ShopContext";
import { tileImage } from "../utils/cloudinary";

const fallbackTiles = [
  {
    label: "Men",
    link: "/shop?department=men",
    image: brand.media.categories.men || brand.media.categories.totes,
    order: 0,
  },
  {
    label: "Women",
    link: "/shop?department=women",
    image: brand.media.categories.women || brand.media.categories.totes,
    order: 1,
  },
    {
      label: "Accessories",
      link: "/shop?department=accessories",
      image: brand.media.categories.accessories || brand.media.categories.bags,
      order: 2,
    },
  ];

const CategoryTiles = () => {
  const { settings } = useContext(ShopContext);
  const tiles = useMemo(() => {
    const hidden = new Set(
      (brand.catalog?.hiddenDepartments || []).map((item) => String(item).toLowerCase())
    );
    const hideDepartment = (tile) => {
      const label = String(tile?.label || "").toLowerCase();
      const link = String(tile?.link || "").toLowerCase();
      if (hidden.has(label)) return false;
      const dept = new URLSearchParams(link.split("?")[1] || "").get("department");
      return !(dept && hidden.has(dept));
    };
    if (settings?.categoryTiles?.length > 0) {
      return [...settings.categoryTiles]
        .filter(hideDepartment)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((tile, index) => ({
          ...tile,
          image:
            tile.image ||
            fallbackTiles[index % fallbackTiles.length]?.image ||
            brand.media.placeholder,
        }));
    }
    return fallbackTiles.filter(hideDepartment);
  }, [settings?.categoryTiles]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
      <div className="text-center mb-8">
        <Title text1={"Shop by"} text2={"category"} eyebrow="Collections" />
        <p className="text-sm text-tz-navy/50 mt-1" data-aos="fade-up" data-aos-delay="40">
          Jackets for men and women
        </p>
      </div>

      <div
        className={`grid grid-cols-1 gap-3 sm:gap-4 max-w-6xl mx-auto ${
          tiles.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {tiles.map((cat, index) => (
          <Link
            key={`${cat.label}-${index}`}
            to={cat.link || "/shop"}
            data-aos="fade-up"
            data-aos-delay={index * 80}
            className="group relative overflow-hidden aspect-[3/4] sm:aspect-[4/5] flex items-end p-4 sm:p-5 bg-tz-cream"
          >
            <img
              src={tileImage(cat.image || brand.media.placeholder)}
              alt={cat.label}
              width={800}
              height={1000}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              onError={(e) => {
                e.currentTarget.src = brand.media.placeholder;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
            <div className="relative z-10">
              <h3 className="font-display text-lg sm:text-xl lg:text-2xl leading-tight font-semibold text-white">
                {cat.label}
              </h3>
              <p className="text-[11px] tracking-[0.16em] uppercase text-tz-blue mt-1 font-semibold">
                Explore →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryTiles;
