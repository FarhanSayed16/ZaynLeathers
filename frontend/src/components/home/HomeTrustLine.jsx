const HomeTrustLine = () => (
  <section className="bg-white border-b border-gray-100">
    <div className="max-w-3xl mx-auto px-4 py-3 text-center sm:hidden">
      <p className="text-[12px] tracking-wide text-tz-navy/70">
        <span className="text-amber-500 tracking-[0.18em] mr-1.5" aria-hidden="true">★★★★★</span>
        <span className="font-semibold text-tz-navy">15,000</span> sold · 99% positive
      </p>
    </div>
    <div className="hidden sm:block max-w-3xl mx-auto px-4 py-6 text-center">
      <p className="text-amber-500 tracking-[0.35em] text-sm" aria-hidden="true">
        ★★★★★
      </p>
      <p className="mt-2 font-display text-3xl sm:text-4xl text-tz-navy">15,000</p>
      <p className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-tz-navy/70">
        Items sold · 99% positive · 4,300 followers
      </p>
    </div>
  </section>
);

export default HomeTrustLine;
