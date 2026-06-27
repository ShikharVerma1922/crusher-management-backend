import express from "express";
import {
  createMaterial,
  editMaterial,
  listMaterialsClerk,
  listMaterialsOwner,
} from "../controllers/material.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/clerk", protect, listMaterialsClerk);
router.get("/", protect, authorize("OWNER"), listMaterialsOwner);
router.post("/", protect, authorize("OWNER"), createMaterial);
router.patch("/:id", protect, authorize("OWNER"), editMaterial);

export default router;
