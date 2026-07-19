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

export const handleUpdateCustomerDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, initialOpeningBalance, openingBalanceDate, creditLimit } =
    req.body;
  console.log(req.body);
  const data = await customerService.updateCustomerDetails({
    id,
    name,
    initialOpeningBalance,
    openingBalanceDate,
    creditLimit,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        data,
        "Customer profile and running balances successfully re-indexed.",
      ),
    );
});

export const handleGetCustomerDetails = async (req, res) => {
  const { id } = req.params;

  const data = await customerService.getCustomerDetailsById({ id });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        data,
        "Customer profile and running balances fetched successfully.",
      ),
    );
};
