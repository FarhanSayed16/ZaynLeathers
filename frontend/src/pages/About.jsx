import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowRightLong } from "react-icons/fa6";
import brand from "../brand";
import SEO from "../components/SEO";
import TrustStrip from "../components/TrustStrip";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const VALUES = [
  {
    title: "Craft, not markups",
    desc: "Manufacturer-direct jackets, priced for the leather and the work — not a long chain of markups.",
  },
  {
    title: "Inspected twice",
    desc: "Every jacket is checked through production and again before it leaves for dispatch.",
  },
  {
    title: "Made to last",
    desc: "Genuine leather, chosen for comfort and durability, with a 30-day warranty on manufacturing defects.",
  },
];

const About = () => {
  const storyImage = brand.about?.storyImage || "/brand/heroes/banner-1-men.png";
  const founderImage = brand.about?.founderImage || "/brand/zayn-logo-black.png";

  return (
    <div className="min-h-screen bg-tz-cream text-tz-navy">
      <SEO
        title="About Us"
        description={`Learn more about ${brand.name} — manufacturer-direct genuine leather since 2015.`}
      />

      {/* Full-bleed leather hero */}
      <section className="relative min-h-[68vh] sm:min-h-[78vh] flex items-end overflow-hidden">
        <img
          src={storyImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-14 sm:pb-20 pt-32">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-[11px] sm:text-xs font-semibold tracking-[0.28em] uppercase text-white/70"
          >
            Since 2015
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1 }}
            className="mt-3 font-display text-4xl sm:text-6xl md:text-7xl font-semibold text-white leading-[1.05]"
          >
            {brand.about.heroTitle}{" "}
            <span className="italic font-medium text-tz-blue">{brand.about.heroHighlight}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.85, delay: 0.35 }}
            className="mt-5 max-w-xl text-sm sm:text-base text-white/85 leading-relaxed"
          >
            {brand.about.heroSubtitle}
          </motion.p>
        </div>
      </section>

      <TrustStrip />

      {/* Story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="order-2 lg:order-1"
          >
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-tz-navy/45">
              Our story
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl text-tz-navy leading-tight">
              Crafted in leather.{" "}
              <span className="italic font-medium">Made to last.</span>
            </h2>
            <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-tz-navy/75">
              <p>{brand.about?.storyLead}</p>
              <p>{brand.about?.storyBody}</p>
            </div>
            <Link
              to="/shop"
              className="mt-8 inline-flex items-center gap-3 bg-tz-navy text-white px-6 py-3 text-sm font-semibold hover:bg-tz-pink transition-colors"
            >
              Shop the collection <FaArrowRightLong />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="order-1 lg:order-2"
          >
            <img
              src={storyImage}
              alt={`${brand.name} leather craft`}
              className="w-full aspect-[4/5] sm:aspect-[4/3] object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Founder note */}
      <section className="bg-tz-navy text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <img
            src={founderImage}
            alt=""
            className="mx-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border border-white/20"
          />
          <p className="mt-8 font-display text-xl sm:text-2xl md:text-3xl italic font-medium leading-relaxed text-white/95">
            “{brand.about.founderNote}”
          </p>
          <p className="mt-8 text-xs font-semibold tracking-[0.22em] uppercase text-tz-blue">
            {brand.about.founderName}
          </p>
          <p className="mt-2 text-[10px] tracking-[0.28em] uppercase text-white/45">Since 2015</p>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-tz-navy/45">
            The promise
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-tz-navy">
            Our core values
          </h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-8 sm:gap-10">
          {VALUES.map((val) => (
            <div key={val.title} className="border-t border-tz-navy/15 pt-6">
              <h3 className="font-display text-xl text-tz-navy">{val.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-tz-navy/65">{val.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-tz-navy/10 bg-[#f7f4ef]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-tz-navy">
            Ready for real leather?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-tz-navy/65">
            Explore jackets and leather essentials from the latest Zayn collection.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-3 bg-tz-navy text-white px-7 py-3.5 text-sm font-semibold hover:bg-tz-pink transition-colors"
          >
            Shop the collection <FaArrowRightLong />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
