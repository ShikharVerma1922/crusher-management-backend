import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { handlePostPaymentRecord } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/", protect, handlePostPaymentRecord);

export default router;
