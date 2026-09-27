import express from "express";
import {
  listProduct,
  addProduct,
  removeProduct,
  singleProduct,
  editProduct,
  getVariants,
  getProductById,
  setProductActive,
  setProductStock,
  duplicateProduct,
  getStyleTemplate,
  setStyleActive,
  setPrimaryListing,
  catalogAudit,
  catalogFix,
  getLowStockProducts,
} from "../controllers/productController.js";
import {
  getRecommendations,
  getCartRecommendations,
  getDiscoveryRecommendations,
} from "../controllers/recommendationController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

const imageFields = upload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
  { name: "image5", maxCount: 1 },
  { name: "image6", maxCount: 1 },
  { name: "image7", maxCount: 1 },
  { name: "image8", maxCount: 1 },
  { name: "sizeimage1", maxCount: 1 },
  { name: "sizeimage2", maxCount: 1 },
]);

productRouter.post("/add", adminAuth, imageFields, addProduct);
productRouter.post("/remove", adminAuth, removeProduct);
productRouter.post("/visibility", adminAuth, setProductActive);
productRouter.post("/stock", adminAuth, setProductStock);
productRouter.post("/duplicate", adminAuth, duplicateProduct);
productRouter.get("/style/:parentId", adminAuth, getStyleTemplate);
productRouter.post("/visibility-style", adminAuth, setStyleActive);
productRouter.post("/primary-listing", adminAuth, setPrimaryListing);
productRouter.get("/catalog-audit", adminAuth, catalogAudit);
productRouter.post("/catalog-fix", adminAuth, catalogFix);
productRouter.get("/variants/:parentId", getVariants);
productRouter.get("/recommendations", getRecommendations);
productRouter.get("/recommendations/discover", getDiscoveryRecommendations);
productRouter.post("/recommendations/cart", getCartRecommendations);
productRouter.post("/single", adminAuth, singleProduct);
productRouter.get("/list", listProduct);
productRouter.get("/low-stock", adminAuth, getLowStockProducts);
productRouter.get("/:id", getProductById);
productRouter.put("/edit/:productId", adminAuth, imageFields, editProduct);

export default productRouter;
