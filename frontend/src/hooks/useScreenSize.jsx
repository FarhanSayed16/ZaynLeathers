import { useEffect, useState } from "react";

const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState("sm");

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      if (width >= 1280) setScreenSize("xl");
      else if (width >= 1024) setScreenSize("lg");
      else if (width >= 768) setScreenSize("md");
      else setScreenSize("sm");
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return screenSize;
};

export default useScreenSize