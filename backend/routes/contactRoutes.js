import express from "express";
import { createContact, listContacts, updateContact, deleteContact } from "../controllers/contactController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/", createContact);
router.get("/", adminAuth, listContacts);
router.patch("/:id", adminAuth, updateContact);
router.delete("/:id", adminAuth, deleteContact);

export default router;
