// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

//Import Routes
import authRoutes from "./routes/auth.route.js";
import { env } from "./config/env.js";

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

app.use(errorHandler);

export default app;
