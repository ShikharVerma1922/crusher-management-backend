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

export const handleGetCustomerRunningLedger = asyncHandler(async (req, res) => {
  const { id: customerId } = req.params;
  const { from, to } = req.query;

  if (!customerId) {
    return res.status(400).json({ error: "Customer ID is required." });
  }
  const data = await customerService.getCustomerRunningLedger({
    customerId,
    from,
    to,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        data,
        "Running ledger for the customer fetched successfully.",
      ),
    );
});
