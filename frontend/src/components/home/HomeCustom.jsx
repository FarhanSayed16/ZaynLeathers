import { useState } from "react";
import { Link } from "react-router-dom";

const TABS = [
  {
    id: "you",
    label: "Made for you",
    body: "Custom sizing starts with a message before you buy. Tell us the fit you want and we cut the jacket around that, instead of asking you to settle for the closest standard size.",
  },
  {
    id: "fit",
    label: "Made to fit",
    body: "Jackets are cut true to size. If you are between sizes, size up for a layer underneath. For a measured fit, send your chest, shoulder, and sleeve numbers before checkout.",
  },
  {
    id: "last",
    label: "Made to last",
    body: "Each jacket is genuine leather, checked through production and again before dispatch. Manufacturing defects are covered for 30 days. With ordinary care, the hide is meant to be worn for years.",
  },
];

const HomeCustom = () => {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((item) => item.id === active) || TABS[0];
  const image = "/brand/categories/women.png";

  return (
    <section className="bg-white">
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 min-h-[420px]">
        <div className="bg-tz-navy text-white px-6 sm:px-10 lg:px-14 py-12 sm:py-16 flex flex-col justify-center">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold tracking-[0.16em] uppercase">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={
                  item.id === active
                    ? "text-white underline underline-offset-8"
                    : "text-white/45 hover:text-white"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-8 text-lg sm:text-xl leading-relaxed text-white/90 max-w-xl">{tab.body}</p>
          <Link
            to="/custom-jackets"
            className="mt-8 inline-flex w-fit px-5 py-3 border border-white/70 text-xs font-semibold tracking-[0.14em] uppercase hover:bg-white hover:text-tz-navy transition-colors"
          >
            Customise your own
          </Link>
        </div>
        <div className="relative min-h-[280px] lg:min-h-full bg-tz-cream">
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_30%]" />
        </div>
      </div>
    </section>
  );
};

export default HomeCustom;
