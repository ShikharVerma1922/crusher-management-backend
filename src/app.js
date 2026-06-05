// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import { env } from "./config/env.js";

//Import Routes
import authRoutes from "./routes/auth.route.js";
import transactionRoutes from "./routes/transaction.route.js";
import materialRoutes from "./routes/material.route.js";

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: env.FRONTEND_URL || "http://localhost:5174",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Base Route Connections
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/materials", materialRoutes);

app.use(errorHandler);

export default app;
