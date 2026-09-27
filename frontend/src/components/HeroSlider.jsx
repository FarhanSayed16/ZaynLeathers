import React, { useEffect, useRef, useState } from "react";
import HeroSlide from "./HeroSlide";

export default function HeroSlider({ banners }) {
  const ref = useRef(null);
  const [index, setIndex] = useState(0);
  const total = banners?.length || 0;

  useEffect(() => {
    if (total <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % total;
        if (ref.current) {
          ref.current.scrollTo({
            left: next * ref.current.clientWidth,
            behavior: "smooth",
          });
        }
        return next;
      });
    }, 5500);
    return () => clearInterval(interval);
  }, [total]);

  if (!total) return null;

  const goTo = (i) => {
    setIndex(i);
    ref.current?.scrollTo({
      left: i * ref.current.clientWidth,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative w-full overflow-hidden">
      <div
        ref={ref}
        className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
      >
        {banners.map((b, i) => (
          <HeroSlide key={b._id || i} {...b} isPriority={i === 0} />
        ))}
      </div>

      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === i ? "bg-white w-5" : "bg-white/45 w-1.5 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
