const STATS = [
  { value: "99%", label: "Positive feedback" },
  { value: "15K", label: "Items sold" },
  { value: "4.3K", label: "Followers" },
  { value: "Top rated", label: "Seller" },
];

const TrustStrip = () => (
  <section className="border-y border-tz-navy/10 bg-[#f7f4ef]">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <p className="text-center text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-tz-navy/50 mb-6">
        Top rated seller
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-display text-3xl sm:text-4xl text-tz-navy">{stat.value}</p>
            <p className="mt-1 text-xs sm:text-sm tracking-wide text-tz-navy/60">{stat.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm leading-relaxed text-tz-navy/65 max-w-2xl mx-auto">
        Zayn Leathers is known for consistent service: careful packing, tracked worldwide delivery, and replies within 24 hours, Monday to Saturday.
      </p>
    </div>
  </section>
);

export default TrustStrip;
