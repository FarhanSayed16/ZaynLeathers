import React, { useEffect, useState } from "react";
import { FaChevronUp } from "react-icons/fa";

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 420);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 left-4 sm:left-6 z-40 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-md text-tz-navy flex items-center justify-center hover:bg-tz-navy hover:text-white transition-colors"
    >
      <FaChevronUp size={14} />
    </button>
  );
};

export default BackToTop;
