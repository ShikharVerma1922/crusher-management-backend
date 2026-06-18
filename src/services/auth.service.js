// src/services/authService.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
/**
 * Generate a JWT Token for an authenticated user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * Register a brand new user (Owner can create Clerks/Supervisors)
 */
export const registerUser = async ({ username, password, name, role }) => {
  const userExists = await prisma.user.findUnique({ where: { username } });
  if (userExists) {
    throw new ApiError(400, "Username is already taken");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name,
      role,
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  return newUser;
};

/**
 * Login User and return access token
 */
export const loginUser = async ({ username, password }) => {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials or account is deactivated");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = generateToken(user.id);

  // Client-side deterministic shift pattern configuration fallback helper
  const shortHex = Date.now().toString(16).toUpperCase().slice(-5);
  const generatedShiftId = `SHIFT-${user.username.toUpperCase()}-${shortHex}`;

  const newShift = await prisma.shift.create({
    data: {
      id: generatedShiftId,
      userId: user.id,
      status: "OPEN",
    },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    shiftId: newShift?.id,
    token,
  };
};
