import React, { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

const ProductAccordion = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-tz-navy/10">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold tracking-wide text-tz-navy">
          {title}
        </span>
        <FaChevronDown
          className={`text-[10px] text-tz-navy/50 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="pb-5 text-sm leading-7 text-tz-navy/80">
          {children}
        </div>
      )}
    </div>
  );
};

export default ProductAccordion;
