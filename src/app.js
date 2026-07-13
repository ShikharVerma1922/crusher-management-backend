// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import { env } from "./config/env.js";

//Import Routes
import authRoutes from "./routes/auth.route.js";
import transactionRoutes from "./routes/transaction.route.js";
import customerRoutes from "./routes/customer.route.js";
import materialRoutes from "./routes/material.route.js";
import voidRoutes from "./routes/void.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import userRoutes from "./routes/user.route.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

// Base Route Connections
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/void-requests", voidRoutes);
app.use("/api/analytics", analyticsRoutes);
app.get("/api/is-online", (req, res) => {
  return res.status(200).json({ isOnline: true });
});

app.use(errorHandler);

export default app;
