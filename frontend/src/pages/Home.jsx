import { Link } from "react-router-dom";
import Banner from "../components/Banner";
import BestSeller from "../components/BestSeller";
import ConnectCards from "../components/ConnectCards";
import FaqList from "../components/FaqList";
import HomeCategories from "../components/home/HomeCategories";
import HomeCommunity from "../components/home/HomeCommunity";
import HomeCustom from "../components/home/HomeCustom";
import HomeProof from "../components/home/HomeProof";
import HomeTalking from "../components/home/HomeTalking";
import HomeTrustLine from "../components/home/HomeTrustLine";
import { FAQ_GROUPS } from "../data/faq";
import SEO from "../components/SEO";

const faqPreview = [
  "Is Zayn Leathers a trusted brand?",
  "Do you ship worldwide?",
  "How long does delivery take?",
  "Can I return a jacket if it does not fit?",
]
  .map((question) => FAQ_GROUPS.flatMap((group) => group.items).find((item) => item.q === question))
  .filter(Boolean);

const Home = () => (
  <div className="bg-white">
    <SEO
      title="Home"
      description="Handcrafted genuine leather jackets for men and women. Free worldwide shipping from Zayn Leathers."
    />

    <Banner />
    <HomeTrustLine />
    <HomeCategories />
    <HomeProof />
    <HomeCustom />
    <BestSeller title="Shop best sellers" subtitle="" />
    <HomeCommunity />
    <HomeTalking />
    <ConnectCards />

    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-16 border-t border-gray-100">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-tz-navy/45 mb-2">Help</p>
      <h2 className="font-display text-3xl sm:text-4xl text-tz-navy mb-6">Frequently asked questions</h2>
      <FaqList groups={[{ id: "home-faq", title: "", items: faqPreview }]} />
      <Link
        to="/faq"
        className="inline-block mt-6 text-sm font-semibold uppercase tracking-wide text-tz-navy underline underline-offset-4"
      >
        All questions
      </Link>
    </section>
  </div>
);

export default Home;
