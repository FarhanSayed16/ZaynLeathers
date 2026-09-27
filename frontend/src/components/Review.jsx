import React, { useRef, useState, useEffect } from "react";
import { FaChevronRight, FaTimes } from "react-icons/fa";
import * as shopApi from "../api/shopApi";
import { isWooMode } from "../api/mode";

export default function VideoUI() {
  const [activeVideo, setActiveVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const scrollRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (isWooMode) {
      setVideos([]);
      return;
    }
    shopApi
      .getVideoReviews()
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch((err) => console.log(err));
  }, []);

  // Auto-scroll only when section is visible and tab is focused
  useEffect(() => {
    const container = scrollRef.current;
    const section = sectionRef.current;
    if (!container || !videos.length) return;

    let frame;
    let lastTime = 0;
    const speed = 0.06;
    let running = false;
    let inView = false;

    const tick = (time) => {
      if (!running || !container) return;

      if (!lastTime) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;

      container.scrollLeft += speed * delta;
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft -= container.scrollWidth / 2;
      }

      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || document.hidden || !inView) return;
      running = true;
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      frame = null;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !document.hidden) start();
        else stop();
      },
      { threshold: 0.15 }
    );

    if (section) observer.observe(section);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (inView) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [videos]);

  const scroll = (dir) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  if (!videos.length) return null;

  return (
    <div ref={sectionRef} className="py-6 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center font-display text-xl sm:text-2xl font-semibold text-tz-navy mb-6">
          Customer reviews
        </h2>

        <div className="relative">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white p-2 rounded-full shadow"
            aria-label="Scroll left"
          >
            <FaChevronRight className="rotate-180" />
          </button>

          <button
            type="button"
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white p-2 rounded-full shadow"
            aria-label="Scroll right"
          >
            <FaChevronRight />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto no-scrollbar px-1"
          >
            {[...videos, ...videos].map((item, index) => (
              <VideoCard
                key={`${item._id || item.video}-${index}`}
                item={item}
                onClick={setActiveVideo}
              />
            ))}
          </div>
        </div>

        {activeVideo && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-3xl">
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="absolute -top-10 right-0 text-white text-xl"
                aria-label="Close"
              >
                <FaTimes />
              </button>
              <video
                src={activeVideo}
                controls
                autoPlay
                playsInline
                className="w-full rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoCard({ item, onClick }) {
  const videoRef = useRef(null);
  const videoUrl = item.video;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.7 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative flex-shrink-0 w-[220px] h-[320px] sm:w-[260px] sm:h-[380px] md:w-[300px] md:h-[440px] rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => onClick(videoUrl)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-3 left-3 bg-white/80 p-2 rounded-full text-sm">
        ▶
      </div>
    </div>
  );
}
