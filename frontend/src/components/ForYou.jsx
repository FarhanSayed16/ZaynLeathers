import { useEffect, useState } from "react";
import RecommendationRail from "./RecommendationRail";
import { readRecentlyViewed } from "../utils/recentlyViewed";

const ForYou = () => {
  const [viewed, setViewed] = useState([]);

  useEffect(() => {
    setViewed(readRecentlyViewed());
  }, []);

  return (
    <RecommendationRail
      endpoint="discover"
      recentlyViewedIds={viewed}
      title1="PICKED"
      title2="FOR YOU"
      subtitle="Based on what you've been looking at — plus bestsellers if you're new"
      limit={10}
    />
  );
};

export default ForYou;
