import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as customerService from "../services/customer.service.js";

export const getAllCustomers = asyncHandler(async (req, res) => {
  const data = await customerService.getAllCustomers();

  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "All of the customers fetched successfully."),
    );
});
