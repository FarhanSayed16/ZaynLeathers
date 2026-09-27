import React, { useEffect, useState } from "react";
import axios from "axios";
import HeroUploadCard from "../components/HeroUploadCard";
import { backendUrl } from "../App";
import { adminHeaders } from "../utils/adminApi";

const HeroManager = () => {
  const [heroes, setHeroes] = useState([]);

  useEffect(() => {
    fetchHeroes();
  }, []);

  const fetchHeroes = async () => {
    const res = await axios.get(`${backendUrl}/api/admin/hero`, {
      headers: adminHeaders(localStorage.getItem("token")),
    });

    if (res.data.success) {
      setHeroes(res.data.heroes);
    }
  };

  const getHeroBySequence = (seq) =>
    heroes.find((h) => h.sequence === seq);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-semibold text-tz-navy">Hero banners</h1>
        <p className="text-sm text-tz-navy/50 mt-1">Four homepage slides. Replace an image without clearing the others.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((seq) => (
          <HeroUploadCard
            key={seq}
            sequence={seq}
            existingHero={getHeroBySequence(seq)}
            onUpdated={fetchHeroes} // 🔁 auto refresh
          />
        ))}
      </div>
    </div>
  );
};

export default HeroManager;