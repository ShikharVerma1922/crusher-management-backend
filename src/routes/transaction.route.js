// src/routes/transactionRoutes.js
import express from "express";
import {
  processTransaction,
  getAllTransactions,
  getShiftTransactions,
  triggerManualReprint,
} from "../controllers/transaction.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 1. Global full ledger list - Restricted to Management level
router.get("/", protect, authorize("SUPERVISOR", "OWNER"), getAllTransactions);

// 2. Clerk limited shift log view
router.get("/shift", protect, authorize("CLERK"), getShiftTransactions);

// 3. Main Data Entry channel
// router.post("/", protect, authorize("CLERK"), processTransaction);
router.post("/", processTransaction);

// 4. Remote hardware manual print trigger override - Open to all validated workers
router.post("/:id/reprint", protect, triggerManualReprint);

export default router;
