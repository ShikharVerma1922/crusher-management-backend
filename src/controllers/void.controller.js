import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as voidService from "../services/void.service.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * @desc    File an error correction request for a specific transaction
 * @route   POST /api/void-requests
 * @access  Private (Clerk Only)
 */
export const fileVoidRequest = asyncHandler(async (req, res) => {
  const { transactionId, reason } = req.body;
  const clerkId = req.user.id;
  console.log("test");
  console.log(transactionId, reason);
  const newRequest = await voidService.createRequest({
    transactionId,
    reason,
    clerkId,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newRequest,
        "Correction request filed successfully for management review",
      ),
    );
});

/**
 * @desc    Fetch stream of pending open clerk requests
 * @route   GET /api/void-requests/pending
 * @access  Private (Supervisor / Owner)
 */
export const listPendingRequests = asyncHandler(async (req, res) => {
  const requests = await voidService.getPendingRequests();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        requests,
        "Pending correction queue retrieved successfully",
      ),
    );
});

/**
 * @desc    Approve or Reject an open correction request
 * @route   PATCH /api/void-requests/:id
 * @access  Private (Supervisor / Owner)
 */
export const resolveVoidRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const adminId = req.user.id;

  const updatedRequest = await voidService.actionRequest(id, {
    status,
    adminNotes,
    adminId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedRequest,
        `Correction request has been officially ${status.toLowerCase()}`,
      ),
    );
});

export const getVoidHistory = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;

  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw new ApiError(400, "Invalid status parameters requested.");
  }

  const paginatedPayload = await voidService.getResolvedVoidHistory(
    status,
    page,
    limit,
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        history: paginatedPayload.records,
        meta: paginatedPayload.pagination,
      },
      "Void history fetched successfully.",
    ),
  );
});
