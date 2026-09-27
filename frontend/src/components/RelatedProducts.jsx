import RecommendationRail from "./RecommendationRail";

const RelatedProducts = ({ productId }) => {
  if (!productId) return null;
  return (
    <RecommendationRail
      productId={productId}
      title1="SIMILAR"
      title2="PRODUCTS"
      subtitle="Matched by style, colour, category, and what other shoppers bought together"
      limit={10}
    />
  );
};

export default RelatedProducts;
