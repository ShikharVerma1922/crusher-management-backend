// src/controllers/authController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as authService from "../services/auth.service.js";
import { cookieOptions } from "../utils/cookieOptions.js";

/**
 * @desc    Register a new user profile
 * @route   POST /api/auth/register
 * @access  Private (Owner Only)
 */
export const register = asyncHandler(async (req, res) => {
  const { username, password, name, role = "CLERK" } = req.body;

  if (
    !username ||
    !name ||
    !password ||
    !role ||
    [name, username, role, password].some(
      (field) => String(field).trim() === "",
    )
  )
    throw new ApiError(400, "All fields are required");

  const newUser = await authService.registerUser({
    username,
    password,
    name,
    role,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, newUser, "User account registered successfully"),
    );
});

/**
 * @desc    Authenticate user & set token in HTTP-only cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Please provide username and password.");
  }

  const { user, shiftId, token } = await authService.loginUser({
    username,
    password,
  });

  res.cookie("token", token, cookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, { user, shiftId }, "Login successful"));
});

/**
 * @desc    Logout User & clear auth cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});
