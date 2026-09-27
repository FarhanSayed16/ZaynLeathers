import React, { useContext } from "react";
import Banner from "../components/Banner";
import CategoryTiles from "../components/CategoryTiles";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
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
    newArrivalsTitle: "NEW ARRIVALS",
    bestSellersTitle: "BEST SELLERS",
  };

  return (
    <div className="bg-tz-cream">
      <SEO
        title="Home"
        description="Crafted in leather. Made to last. Shop leather jackets, bags, and more at Zayn Leathers."
      />

      {config.showHero !== false && <Banner />}

      <div className="bg-white">
        {config.showCategories !== false && (
          <section data-aos="fade-up">
            <CategoryTiles />
          </section>
        )}
      </div>

      {config.showNewArrivals !== false && (
        <section
          className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8"
          data-aos="fade-up"
        >
          <LatestCollection title={config.newArrivalsTitle} />
        </section>
      )}

      <div data-aos="fade-up">
        <VibeCTA />
      </div>

      {config.showBestSellers !== false && (
        <section
          className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8"
          data-aos="fade-up"
        >
          <BestSeller title={config.bestSellersTitle} />
        </section>
      )}

      <section
        className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8"
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
