import React, { useEffect, useState } from "react";
import SimilarColorProductItem from "./SimilarColorProductItem";
import { isWooMode } from "../api/mode";
import { getApiBase } from "../api/mode";

const SimilarColorProducts = ({ parentId, currentProductId }) => {
  const [related, setRelated] = useState([]);
  const backendUrl = getApiBase();

  useEffect(() => {
    // Parent/color variant matrix is a Node schema feature — skip in Woo mode
    if (isWooMode || !parentId) {
      setRelated([]);
      return;
    }

    let cancelled = false;
    fetch(`${backendUrl}/api/product/variants/${encodeURIComponent(parentId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        setRelated((data.products || []).filter((p) => p._id !== currentProductId));
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });

    return () => {
      cancelled = true;
    };
  }, [parentId, currentProductId, backendUrl]);

  if (!related.length) return null;

  return (
    <div className="grid grid-cols-6 gap-2">
      {related.map((item) => (
        <SimilarColorProductItem
          key={item._id}
          id={item._id}
          image={item.image}
          color={item.color}
          isCurrent={item._id === currentProductId}
        />
      ))}
    </div>
  );
};

export default SimilarColorProducts;
