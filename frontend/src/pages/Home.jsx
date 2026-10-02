import React, { useContext } from "react";
import Banner from "../components/Banner";
import CategoryTiles from "../components/CategoryTiles";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import CategoryCarousel from "../components/CategoryCarousel";
import ForYou from "../components/ForYou";
import InstagramSection from "../components/InstagramSection";
import Review from "../components/Review";
import VibeCTA from "../components/VibeCTA";
import { ShopContext } from "../context/ShopContext";
import SEO from "../components/SEO";

const Home = () => {
  const { settings } = useContext(ShopContext);

  const config = settings?.homeConfig || {
    showHero: true,
    showCategories: true,
    showNewArrivals: true,
    showBestSellers: true,
    showInstagram: true,
    showReviews: true,
    newArrivalsTitle: "New Arrivals",
    bestSellersTitle: "Best Selling Products",
  };

  return (
    <div className="bg-white">
      <SEO
        title="Home"
        description="Crafted in leather. Made to last. Shop leather jackets, bags, and more at Zayn Leathers."
      />

      {config.showHero !== false && <Banner />}

      {config.showBestSellers !== false && (
        <div data-aos="fade-up">
          <BestSeller title={config.bestSellersTitle || "Best Selling Products"} />
        </div>
      )}

      {config.showNewArrivals !== false && (
        <div className="border-t border-gray-100" data-aos="fade-up">
          <LatestCollection title={config.newArrivalsTitle || "New Arrivals"} />
        </div>
      )}

      <div className="border-t border-gray-100" data-aos="fade-up">
        <CategoryCarousel
          title="Men's Leather Jackets"
          subtitle="Bikers, bombers, and everyday leather"
          department="men"
          viewAllHref="/shop?department=men"
        />
      </div>

      <div className="border-t border-gray-100" data-aos="fade-up">
        <CategoryCarousel
          title="Women's Leather"
          subtitle="Jackets and essentials made to last"
          department="women"
          viewAllHref="/shop?department=women"
        />
      </div>

      <div className="border-t border-gray-100" data-aos="fade-up">
        <CategoryCarousel
          title="Bags & Everyday Carry"
          subtitle="Handbags, totes, and work bags"
          department="bags"
          viewAllHref="/shop?department=bags"
        />
      </div>

      {config.showCategories !== false && (
        <div className="border-t border-gray-100 bg-tz-cream/40" data-aos="fade-up">
          <CategoryTiles />
        </div>
      )}

      <div data-aos="fade-up">
        <VibeCTA />
      </div>

      <section
        className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100"
        data-aos="fade-up"
      >
        <ForYou />
      </section>

      {config.showInstagram !== false && (
        <section data-aos="fade-up">
          <InstagramSection />
        </section>
      )}

      {config.showReviews !== false && (
        <section
          className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-2"
          data-aos="fade-up"
        >
          <Review />
        </section>
      )}
    </div>
  );
};

export default Home;
