// src/routes/customerRoutes.js
import express from "express";
import { getAllCustomers } from "../controllers/customer.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 1. Global full ledger list - Restricted to Management level
router.get("/", protect, getAllCustomers);

export default router;
