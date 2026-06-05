import express from "express";
import {
  createMaterial,
  listMaterials,
  editMaterial,
} from "../controllers/material.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, listMaterials);
router.post("/", protect, authorize("OWNER"), createMaterial);
router.patch("/:id", protect, authorize("OWNER"), editMaterial);

export default router;
