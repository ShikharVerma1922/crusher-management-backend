import express from "express";
import {
  directVoidTransaction,
  fileVoidRequest,
  getVoidHistory,
  listPendingRequests,
  resolveVoidRequest,
} from "../controllers/void.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Clerks report errors
router.post("/", protect, authorize("CLERK", "OWNER"), fileVoidRequest);

// Management views and resolves the correction stream queue
router.get(
  "/pending",
  protect,
  authorize("SUPERVISOR", "OWNER"),
  listPendingRequests,
);
router.patch(
  "/:id",
  protect,
  authorize("SUPERVISOR", "OWNER"),
  resolveVoidRequest,
);
router.get("/history", protect, authorize("OWNER"), getVoidHistory);

router.post("/direct", protect, authorize("OWNER"), directVoidTransaction);

export default router;
