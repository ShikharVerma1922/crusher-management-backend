// src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

// 1. Verify JWT and authenticate user
export const protect = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!req.user || !req.user.isActive) {
      throw new ApiError(401, "Not authorized, user account is inactive.");
    }

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token.");
  }
};

// 2. Role Authorization Guard (Restricts routes based on explicit roles)
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role [${req.user.role}] is not allowed to access this resource.`,
      );
    }

    next();
  };
};
