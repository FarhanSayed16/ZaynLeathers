import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import brand from "../../brand";
import { ShopContext } from "../../context/ShopContext";
import { productMatchesCategory, productMatchesDepartment } from "../../utils/categoryMap";

function productImage(product) {
  const image = product?.image;
  if (Array.isArray(image)) return image.find(Boolean) || "";
  return image || "";
}

function matchesCategory(product, department, category) {
  if (!product) return false;
  if (department && !productMatchesDepartment(product, department)) return false;
  if (!category) return true;
  return productMatchesCategory(product, category);
}

const FEATURED = [
  {
    label: "Men's Jackets",
    path: "/shop?department=men",
    image: brand.media?.categories?.men,
    department: "men",
  },
  {
    label: "Women's Jackets",
    path: "/shop?department=women",
    image: "/brand/categories/women.png",
    department: "women",
  },
];

const STYLES = [
  { label: "Men's Bikers", path: "/shop?department=men&category=biker-jackets", department: "men", category: "biker-jackets" },
  { label: "Men's Bombers", path: "/shop?department=men&category=bomber-jackets", department: "men", category: "bomber-jackets" },
  { label: "Men's Suede", path: "/shop?department=men&category=suede-jackets", department: "men", category: "suede-jackets" },
  { label: "Men's Coats", path: "/shop?department=men&category=leather-coats", department: "men", category: "leather-coats" },
  { label: "Women's Bikers", path: "/shop?department=women&category=biker-jackets", department: "women", category: "biker-jackets" },
  { label: "Women's Coats", path: "/shop?department=women&category=leather-coats", department: "women", category: "leather-coats" },
];

const HomeCategories = () => {
  const { products } = useContext(ShopContext);

  const styleCards = useMemo(
    () =>
      STYLES.map((style) => {
        const match = (products || []).find((product) =>
          matchesCategory(product, style.department, style.category)
        );
        const fallback =
          style.department === "women"
            ? brand.media?.categories?.women
            : brand.media?.categories?.men;
        return {
          ...style,
          image: style.image || productImage(match) || fallback || brand.media?.placeholder,
        };
      }),
    [products]
  );

  return (
    <section className="bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {FEATURED.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="group relative block aspect-[4/5] overflow-hidden bg-tz-cream"
            >
              <img
                src={card.image || brand.media?.placeholder}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                  card.department === "women" ? "object-[center_28%]" : "object-[center_35%]"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <p className="absolute bottom-6 left-0 right-0 text-center text-white text-2xl sm:text-3xl font-semibold tracking-wide">
                {card.label}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
          {styleCards.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="group relative shrink-0 w-[68%] sm:w-[240px] lg:w-[calc(20%-0.75rem)] snap-start aspect-[3/4] overflow-hidden bg-tz-cream"
            >
              <img
                src={card.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-[center_22%] transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <p className="absolute bottom-4 left-3 right-3 text-center text-white text-base sm:text-lg font-semibold">
                {card.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeCategories;
