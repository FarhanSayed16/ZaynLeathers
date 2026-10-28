import { Link } from "react-router-dom";
import brand from "../../brand";

const HomeProof = () => (
  <section className="bg-[#f6f5f3] border-y border-black/5">
    <div className="max-w-2xl mx-auto px-4 py-14 sm:py-20 text-center">
      <p className="text-amber-500 tracking-[0.4em] text-lg" aria-hidden="true">
        ★★★★★
      </p>
      <p className="mt-5 font-display text-4xl sm:text-5xl text-tz-navy tracking-tight">15,000</p>
      <p className="mt-2 text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase text-tz-navy/70">
        Items sold · 99% positive feedback
      </p>
      <p className="mt-4 text-sm sm:text-base leading-relaxed text-tz-navy/70">
        {brand.about?.storyLead}
      </p>
      <Link
        to="/about"
        className="inline-flex mt-7 px-5 py-3 bg-tz-navy text-white text-xs font-semibold tracking-[0.14em] uppercase"
      >
        Why and how we did it
      </Link>
    </div>
  </section>
);

export default HomeProof;
