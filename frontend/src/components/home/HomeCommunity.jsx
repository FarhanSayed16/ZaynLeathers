import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import brand from "../../brand";
import * as shopApi from "../../api/shopApi";

function reelId(url) {
  const match = String(url || "").match(/\/reel\/([^/?#]+)/);
  return match ? match[1] : "";
}

const LOCAL_REELS = new Set([
  "C2uofJip8aF",
  "DfCqEzbNaej",
  "DeU7c0sCR15",
  "DdlTSdPtmBd",
  "Ddhi1TdMc-g",
  "DcytdCQsiYD",
]);

const REEL_COPY = {
  C2uofJip8aF: { label: "Black leather jacket", to: "/shop?department=men" },
  DfCqEzbNaej: { label: "Custom leather jacket", to: "/custom-jackets" },
  DeU7c0sCR15: { label: "Black leather jacket", to: "/shop?department=men" },
  DdlTSdPtmBd: { label: "Maroon crocodile jacket", to: "/custom-jackets" },
  "Ddhi1TdMc-g": { label: "Brown leather jacket", to: "/shop?department=men" },
  DcytdCQsiYD: { label: "Leather footwear", to: "/shop?department=accessories" },
};

const fallbackReels = (brand.social?.reels || []).map((url) => ({ instagramLink: url }));

function ReelCard({ item }) {
  const videoRef = useRef(null);
  const holdPause = useRef(false);
  const [paused, setPaused] = useState(false);
  const id = reelId(item.instagramLink);
  const local = LOCAL_REELS.has(id);
  const src = local ? `/brand/reels/${id}.mp4` : "";
  const poster = local ? `/brand/reels/${id}.jpg` : item.image || "";
  const copy = REEL_COPY[id] || {};
  const label = item.caption || copy.label || "";
  const href = item.productLink || copy.to || item.instagramLink || brand.social.instagram;
  const external = /^https?:/i.test(href);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;
    video.muted = true;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = () => {
      if (holdPause.current || motion.matches) return;
      video.play().catch(() => {});
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else video.pause();
      },
      { threshold: 0.45 }
    );
    io.observe(video);
    start();
    return () => io.disconnect();
  }, [src]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      holdPause.current = false;
      setPaused(false);
      video.muted = true;
      video.play().catch(() => {});
    } else {
      holdPause.current = true;
      setPaused(true);
      video.pause();
    }
  };

  const caption = (
    <>
      {poster ? (
        <img src={poster} alt="" className="h-12 w-10 object-cover shrink-0 bg-neutral-100" />
      ) : null}
      <p className="text-[13px] leading-snug text-neutral-900 line-clamp-2">{label}</p>
    </>
  );

  return (
    <article className="snap-start shrink-0 w-[72vw] sm:w-[230px] lg:w-[248px] bg-white shadow-[0_10px_28px_rgba(28,25,23,0.08)]">
      <div className="relative bg-neutral-900">
        {src ? (
          <video
            ref={videoRef}
            src={src}
            poster={poster || undefined}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            className="block w-full aspect-[9/16] object-cover"
          />
        ) : poster ? (
          <img src={poster} alt={label || "Community reel"} className="block w-full aspect-[9/16] object-cover" />
        ) : null}
        {src ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={paused ? "Play reel" : "Pause reel"}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-900 shadow-md"
          >
            {paused ? (
              <svg viewBox="0 0 12 14" className="ml-0.5 h-3 w-3" aria-hidden="true">
                <path d="M1 1.2v11.6L11 7 1 1.2Z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 14" className="h-3 w-3" aria-hidden="true">
                <path d="M1 1h3.2v12H1V1Zm6.8 0H11v12H7.8V1Z" fill="currentColor" />
              </svg>
            )}
          </button>
        ) : null}
      </div>
      {label ? (
        external ? (
          <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 px-2.5 py-3 hover:bg-neutral-50">
            {caption}
          </a>
        ) : (
          <Link to={href} className="flex items-center gap-2.5 px-2.5 py-3 hover:bg-neutral-50">
            {caption}
          </Link>
        )
      ) : null}
    </article>
  );
}

const HomeCommunity = () => {
  const [items, setItems] = useState(fallbackReels);
  const scrollerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    shopApi
      .getInstagramPromos()
      .then((res) => {
        const list = (Array.isArray(res?.promos) ? res.promos : []).filter((item) => item?.instagramLink);
        if (!cancelled && list.length) setItems(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    const frame = requestAnimationFrame(() => {
      const extra = el.scrollWidth - el.clientWidth;
      if (extra > 24) el.scrollLeft = extra / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [items]);

  if (!items.length) return null;

  return (
    <section className="bg-white border-t border-gray-100 py-12 sm:py-16" aria-label="Community in action">
      <h2 className="mb-6 text-center text-[15px] sm:text-base font-semibold tracking-[0.22em] uppercase text-neutral-900 [font-family:var(--brand-font-body)]">
        Community in action
      </h2>
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto no-scrollbar px-4 sm:px-6 pb-2"
      >
        {items.map((item, itemIndex) => (
          <ReelCard key={reelId(item.instagramLink) || itemIndex} item={item} />
        ))}
      </div>
      <p className="mt-5 text-center">
        <a
          href={brand.social.instagram}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-tz-navy underline underline-offset-4"
        >
          @zaynleather.in
        </a>
      </p>
    </section>
  );
};

export default HomeCommunity;
