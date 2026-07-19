import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as paymentService from "../services/payment.service.js";

export const handlePostPaymentRecord = asyncHandler(async (req, res) => {
  const {
    customerId,
    amountPaid,
    paymentMode,
    referenceNo,
    remarks,
    paymentDate,
    businessDate,
  } = req.body;
  console.log(req.body);

  const data = await paymentService.createPaymentRecord({
    customerId,
    amountPaid,
    paymentMode,
    referenceNo,
    remarks,
    paymentDate,
    businessDate,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, data, "Payment receipt posted successfully."));
});

/**
 * @desc    Get complete payment history ledger
 * @route   GET /api/payments
 * @access  Private (Supervisor / Owner Only)
 */
export const handleGetAllPayments = asyncHandler(async (req, res) => {
  const { page, limit, search, startDate, endDate } = req.query;

  const data = await paymentService.getAllPayments({
    page,
    limit,
    search,
    startDate,
    endDate,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Payment records compiled successfully"));
});

/**
 * @desc    Get complete payment history ledger for export
 * @route   GET /api/payments/export
 * @access  Private (Supervisor / Owner Only)
 */
export const handleExportGlobalPayments = asyncHandler(async (req, res) => {
  const { search, startDate, endDate } = req.query;
  const data = await paymentService.exportGlobalPayments({
    search,
    startDate,
    endDate,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        data,
        "Global payment registry records compiled successfully for export",
      ),
    );
});
