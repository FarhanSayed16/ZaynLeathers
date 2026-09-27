import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroSlider from "./HeroSlider";
import brand from "../brand";
import * as shopApi from "../api/shopApi";

const Banner = () => {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const data = await shopApi.getHeroBanners();
        if (data.success && data.heroes) {
          const list = Array.isArray(data.heroes) ? data.heroes : [];
          const activeHeroes = list.filter((h) => h.isActive !== false);
          setHeroes(activeHeroes);
        }
      } catch (error) {
        console.error("Failed to fetch heroes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroes();
  }, []);

  if (loading) {
    return <div className="w-full h-[72vh] sm:h-[78vh] md:h-[85vh] min-h-[420px] bg-tz-cream animate-pulse" />;
  }

  if (heroes.length > 0) {
    return <HeroSlider banners={heroes} />;
  }

  return (
    <section className="relative w-full h-[72vh] sm:h-[78vh] md:h-[85vh] min-h-[420px] max-h-[920px] overflow-hidden bg-tz-navy">
      <img
        src={brand.media.heroes?.[0]?.image || brand.media.categories?.men || brand.media.placeholder}
        alt={brand.name}
        width={1600}
        height={900}
        className="absolute inset-0 w-full h-full object-cover object-top animate-hero-zoom"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-10 flex items-end sm:items-center pb-16 sm:pb-0 pointer-events-none">
        <div className="max-w-xl text-white pointer-events-auto">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-tz-blue mb-3">
            {brand.name}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05]">
            {brand.about?.heroTitle || brand.tagline}
            <br />
            <span className="italic font-medium text-tz-blue">{brand.about?.heroHighlight || ""}</span>
          </h1>
          <Link
            to="/shop"
            className="inline-flex mt-8 bg-tz-pink text-white font-semibold text-sm px-7 py-3 hover:bg-white hover:text-tz-navy transition-colors"
          >
            Shop now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Banner;
