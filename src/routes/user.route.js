// src/routes/authRoutes.js
import express from "express";
import {
  getClerks,
  profile,
  updateUser,
} from "../controllers/user.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/profile", protect, authorize("OWNER"), profile);
router.get("/clerks", protect, authorize("OWNER"), getClerks);
router.patch("/:username", protect, authorize("OWNER"), updateUser);

export default router;
