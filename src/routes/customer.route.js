// src/routes/customerRoutes.js
import express from "express";
import {
  getAllCustomers,
  handleGetCustomerDetails,
  handleGetCustomerRunningLedger,
  handleUpdateCustomerDetails,
} from "../controllers/customer.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 1. Global full ledger list - Restricted to Management level
router.get("/", protect, getAllCustomers);
router.get("/:id", protect, authorize("OWNER"), handleGetCustomerRunningLedger);
router.get(
  "/detail/:id",
  protect,
  authorize("OWNER"),
  handleGetCustomerDetails,
);
router.put(
  "/detail/:id",
  protect,
  authorize("OWNER"),
  handleUpdateCustomerDetails,
);

export default router;
