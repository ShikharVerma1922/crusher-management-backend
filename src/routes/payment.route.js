import express from "express";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import {
  handleExportGlobalPayments,
  handleGetAllPayments,
  handlePostPaymentRecord,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("OWNER", "CLERK", "SUPERVISOR"),
  handlePostPaymentRecord,
);
router.get("/", protect, authorize("OWNER"), handleGetAllPayments);
router.get("/export", protect, authorize("OWNER"), handleExportGlobalPayments);

export default router;
