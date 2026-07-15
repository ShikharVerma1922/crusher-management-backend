// src/routes/customerRoutes.js
import express from "express";
import {
  getAllCustomers,
  handleGetCustomerRunningLedger,
} from "../controllers/customer.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 1. Global full ledger list - Restricted to Management level
router.get("/", protect, getAllCustomers);
router.get("/:id", protect, authorize("OWNER"), handleGetCustomerRunningLedger);

export default router;
