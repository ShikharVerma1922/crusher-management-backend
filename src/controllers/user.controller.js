import * as userService from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const profile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile fetched successfully"));
});

export const getClerks = asyncHandler(async (req, res) => {
  const clerks = await userService.getAllClerksFromLedger();
  return res
    .status(200)
    .json(new ApiResponse(200, clerks, "Clerks data fetched successfully"));
});

export const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserProfileData(
    req.params.username,
    req.body,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User profile parameters synced"));
});
