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
import voidRoutes from "./routes/void.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import userRoutes from "./routes/user.route.js";

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  }),
);

// app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

// Base Route Connections
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/void-requests", voidRoutes);
app.use("/api/analytics", analyticsRoutes);
app.get("/api/test", (req, res) => {
  return res.send("Hello Shikhar");
  console.log("Hello world");
});

app.use(errorHandler);

export default app;
