// src/routes/transactionRoutes.js
import express from "express";
import {
  processTransaction,
  getAllTransactions,
  getShiftTransactions,
  triggerManualReprint,
  getLatestReceiptNum,
  handleUpdateCreditAmount,
  exportAllTransactions,
  getUnsettledTransactions,
  batchSettleTransactions,
} from "../controllers/transaction.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 1. Global full ledger list - Restricted to Management level
router.get("/", protect, authorize("SUPERVISOR", "OWNER"), getAllTransactions);

// 2. Clerk limited shift log view
router.get("/shift", protect, authorize("CLERK"), getShiftTransactions);

// 3. Main Data Entry channel
router.post("/", protect, authorize("CLERK", "OWNER"), processTransaction);

// 4. Remote hardware manual print trigger override - Open to all validated workers
router.post("/:id/reprint", protect, triggerManualReprint);

// 5. Get latest receipt number
router.get("/latest-receipt-num", protect, getLatestReceiptNum);

// 6. Update credit amount
router.patch(
  "/:id/credit-amount",
  protect,
  authorize("OWNER"),
  handleUpdateCreditAmount,
);

// 7. Export full ledger list
router.get(
  "/export",
  protect,
  authorize("SUPERVISOR", "OWNER"),
  exportAllTransactions,
);

// 8. Global full unsettled transaction list - Restricted to Management level
router.get(
  "/unsettled",
  protect,
  authorize("SUPERVISOR", "OWNER"),
  getUnsettledTransactions,
);

// 9. Batch settle the unsettled transactions
router.post(
  "/batch-settle",
  protect,
  authorize("SUPERVISOR", "OWNER"),
  batchSettleTransactions,
);

export default router;
