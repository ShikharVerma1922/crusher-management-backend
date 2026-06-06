import express from "express";
import {
  getDashboardSummary,
  getMaterialAnalytics,
} from "../controllers/analytics.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("OWNER"));

router.get("/summary", getDashboardSummary);
router.get("/materials", getMaterialAnalytics);

export default router;
