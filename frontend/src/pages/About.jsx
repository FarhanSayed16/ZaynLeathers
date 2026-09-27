import React, { useContext } from "react";
import { FaLeaf, FaGem, FaLightbulb, FaQuoteRight, FaHeart, FaStar } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowRightLong } from "react-icons/fa6";
import { motion } from "framer-motion";
import brand from "../brand";
import SEO from "../components/SEO";
import { ShopContext } from "../context/ShopContext";

const About = () => {
  const navigate = useNavigate();
  const { settings } = useContext(ShopContext);
  
  const heroVideo = settings?.aboutConfig?.heroVideo || brand.about.heroVideo;

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-tz-cream text-tz-navy overflow-hidden relative">
      <SEO title="About Us" description={`Learn more about ${brand.name} and our mission.`} />
      
      {/* Ambient Glows */}
      <div className="absolute top-[20%] left-0 w-[600px] h-[600px] bg-tz-pink/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[60%] right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[150px] pointer-events-none" />

      {/* Cinematic Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden rounded-b-[3rem] sm:rounded-b-[4rem] mx-2 sm:mx-4 mt-2 shadow-2xl z-10 bg-tz-navy">
        {heroVideo ? (
          <video
            src={heroVideo}
            poster={brand.about.storyImage || "/brand/about-story.jpg"}
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        ) : (
          <img
            src={brand.about.storyImage || "/brand/about-story.jpg"}
            alt={brand.name}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        )}
        
        {/* Softer, more cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-tz-navy/80 via-tz-navy/30 to-black/30 mix-blend-multiply" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto mt-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}
            className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-tight tracking-tight"
          >
            {brand.about.heroTitle}{" "}
            <span className="font-serif italic font-medium text-tz-pink block mt-2 sm:mt-4">{brand.about.heroHighlight}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }}
            className="mt-6 sm:mt-8 text-sm sm:text-lg md:text-xl text-white/90 font-light tracking-wide max-w-2xl mx-auto leading-relaxed"
          >
            {brand.about.heroSubtitle}
          </motion.p>
        </div>
      </section>

      {/* Overlapping Editorial Story Section */}
      <section className="max-w-7xl mx-auto py-24 sm:py-32 px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center relative">
          
          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
            className="w-full lg:w-[65%] relative z-0"
          >
            <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <img src={brand.about.storyImage || "/brand/about-story.jpg"} alt="Our Story" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-tz-navy/5 mix-blend-overlay" />
            </div>
          </motion.div>

          {/* Overlapping Text Card */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1, delay: 0.3 }}
            className="w-full lg:w-[45%] relative z-10 -mt-20 lg:mt-0 lg:-ml-32"
          >
            <div className="bg-white/90 backdrop-blur-xl p-8 sm:p-12 lg:p-14 rounded-[2.5rem] shadow-[0_20px_60px_rgb(0,0,0,0.06)] border border-white">
              <p className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-tz-pink mb-4">Our Story</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6 text-tz-navy leading-tight">
                Crafted in leather. <br/><span className="font-serif italic font-medium text-tz-pink">Made to last.</span>
              </h2>
              <div className="space-y-4 text-tz-navy/70 leading-relaxed text-sm sm:text-base">
                <p>
                  <span className="font-bold text-tz-navy">{brand.name}</span> was built around honest leather craftsmanship — jackets, bags, and essentials designed to be worn often and kept longer.
                </p>
                <p>
                  {brand.about?.founderNote ||
                    "From motorcycle jackets to office bags, every piece is chosen for material quality, clean cut, and everyday durability."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Anchored Founder's Note */}
      <section className="py-16 sm:py-24 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
            className="bg-tz-navy text-white rounded-[3rem] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl"
          >
            {/* Interior glows */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-tz-pink/30 rounded-full blur-[100px]" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px]" />
            
            <div className="relative z-10">
              <div className="relative inline-block mb-10">
                <img 
                  src={brand.about.founderImage || "/brand/about-founder.jpg"} 
                  alt="Founder" 
                  className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full border-4 border-white/20 shadow-xl object-cover relative z-10"
                />
                <div className="absolute -bottom-2 -right-2 bg-tz-pink w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-20">
                  <FaQuoteRight className="text-white text-sm" />
                </div>
              </div>
              
              <p className="text-lg sm:text-2xl md:text-3xl font-serif italic font-medium text-white/95 leading-relaxed mb-10 max-w-3xl mx-auto px-4">
                "{brand.about.founderNote}"
              </p>
              
              <div className="inline-block pt-6">
                <p className="font-bold tracking-[0.2em] uppercase text-xs sm:text-sm text-tz-pink mb-1.5">{brand.about.founderName}</p>
                <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-[0.3em]">Founder & Creative Director</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Premium Core Values */}
      <section className="max-w-7xl mx-auto py-24 sm:py-32 px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16 sm:mb-20">
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-tz-pink mb-4">The Promise</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-tz-navy">
            Our Core <span className="font-serif italic text-tz-pink">Values</span>
          </h2>
        </div>

        <motion.div 
          variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {[
            { icon: FaGem, title: "Material First", desc: "Real leather and suede with finishes that age well — not fast-fashion throwaways.", color: "text-tz-pink", bg: "bg-tz-pink/10" },
            { icon: FaLeaf, title: "Everyday Durability", desc: "Jackets, bags, and accessories built for daily wear, travel, and work.", color: "text-tz-blue", bg: "bg-tz-blue-soft" },
            { icon: FaLightbulb, title: "Clean Craft", desc: "Strong stitching, thoughtful hardware, and silhouettes that stay current.", color: "text-tz-navy", bg: "bg-tz-navy/10" }
          ].map((val, i) => (
            <motion.div key={i} variants={fadeUp} className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 text-center shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white hover:-translate-y-2 transition-transform duration-500 group">
              <div className={`w-16 h-16 mx-auto rounded-full ${val.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <val.icon className={`text-2xl ${val.color}`} />
              </div>
              <h3 className="text-xl font-bold text-tz-navy mb-3">{val.title}</h3>
              <p className="text-sm text-tz-navy/60 leading-relaxed">{val.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Minimal CTA */}
      <section className="py-24 sm:py-32 text-center px-4 relative z-10 mb-10">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-tz-navy mb-6">
          Ready for Real <span className="font-serif italic text-tz-pink pr-2">Leather?</span>
        </h2>
        <p className="text-sm sm:text-base text-tz-navy/60 mb-10 max-w-md mx-auto">
          Explore jackets, bags, and leather essentials from the latest Zayn collection.
        </p>
        <Link to="/shop" className="inline-flex items-center gap-3 bg-tz-navy text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-tz-pink hover:-translate-y-1 hover:shadow-xl hover:shadow-tz-pink/20 transition-all duration-300">
          Shop The Collection <FaArrowRightLong />
        </Link>
      </section>
    </div>
  );
};

export default About;