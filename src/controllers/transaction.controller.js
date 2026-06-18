import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as transactionService from "../services/transaction.service.js";
import { io } from "../server.js";

/**
 * @desc    Log weight data & instantly trigger 3x receipt sequence
 * @route   POST /api/transactions
 * @access  Private (Clerk Only)
 */
export const processTransaction = asyncHandler(async (req, res) => {
  // console.log("[Incoming Payload Data]:", req.body);
  const {
    vehicleNumber,
    customerName,
    grossWeight,
    tareWeight,
    // materialId,
    clerkId,
  } = req.body;
  const transaction = await transactionService.createTransactionRecord({
    vehicleNumber,
    customerName,
    grossWeight,
    tareWeight,
    // materialId,
    clerkId: req.user.id,
  });

  // This layout structure cleanly maps to the raw string properties the Android RawBT agent needs
  io.to("plant_clerk_room").emit("print-job-triggered", {
    receiptNumber: transaction.receiptNumber,
    vehicleNumber: transaction.vehicleNumber,
    customerName: transaction.customerName,
    materialName: transaction.material.name,
    grossWeight: transaction.grossWeight,
    tareWeight: transaction.tareWeight,
    netWeight: transaction.netWeight,
    rateApplied: transaction.rateApplied,
    totalAmount: transaction.totalAmount,
    clerkName: transaction.clerk.name,
    timestamp: transaction.createdAt,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        transaction,
        "Transaction logged and print event broadcasted successfully",
      ),
    );
});

/**
 * @desc    Get complete transaction history ledger
 * @route   GET /api/transactions
 * @access  Private (Supervisor / Owner Only)
 */
export const getAllTransactions = asyncHandler(async (req, res) => {
  const { page, limit, search, startDate, endDate } = req.query;

  const data = await transactionService.getGlobalTransactions({
    page,
    limit,
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
        "Global transaction registry records compiled successfully",
      ),
    );
});

/**
 * @desc    Get restricted shift-only records for logged-in clerk
 * @route   GET /api/transactions/shift
 * @access  Private (Clerk Only)
 */
export const getShiftTransactions = asyncHandler(async (req, res) => {
  const clerkId = req.user.id;

  const transactions =
    await transactionService.getClerkShiftTransactions(clerkId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        transactions,
        "Clerk current shift transaction logs retrieved",
      ),
    );
});

/**
 * @desc    Force a manual reprint socket broadcast for a past slip
 * @route   POST /api/transactions/:id/reprint
 * @access  Private (All Roles)
 */
export const triggerManualReprint = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await transactionService.getTransactionById(id);

  // Re-broadcast the print signature over WebSockets to your local agent channel
  io.to("plant_gate_1").emit("print-job-triggered", {
    receiptNumber: transaction.receiptNumber,
    vehicleNumber: transaction.vehicleNumber,
    customerName: transaction.customerName,
    materialName: transaction.material.name,
    grossWeight: transaction.grossWeight,
    tareWeight: transaction.tareWeight,
    netWeight: transaction.netWeight,
    rateApplied: transaction.rateApplied,
    totalAmount: transaction.totalAmount,
    clerkName: transaction.clerk.name,
    timestamp: transaction.createdAt,
    isReprint: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        `Reprint command successfully broadcasted to Gate Printer`,
      ),
    );
});
