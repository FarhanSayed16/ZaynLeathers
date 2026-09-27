import React from "react";

const Title = ({ text1, text2, align = "center", eyebrow }) => {
  return (
    <div
      className={`mb-3 ${align === "center" ? "text-center" : "text-left"}`}
      data-aos="fade-up"
    >
      {eyebrow ? (
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-gray-500 mb-2">
          {eyebrow}
        </p>
      ) : null}
      <p className="font-display text-tz-navy text-3xl md:text-4xl font-semibold tracking-tight">
        {text1} {text2}
      </p>
    </div>
  );
};

export default Title;
