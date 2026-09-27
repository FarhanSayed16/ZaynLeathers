import express from "express";
import HeroBanner from "../models/HeroBanner.js";

const router = express.Router();

router.get("/hero", async (req, res) => {
  const hero = await HeroBanner.findOne({ isActive: true });
  res.json(hero);
});

export default router;