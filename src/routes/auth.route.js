// src/routes/authRoutes.js
import express from "express";
import { register, login, logout } from "../controllers/auth.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route for signing in
router.post("/login", login);
router.post("/register", protect, authorize("OWNER"), register);
router.post("/logout", protect, logout);

export default router;
