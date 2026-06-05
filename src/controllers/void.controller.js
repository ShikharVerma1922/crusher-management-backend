import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as voidService from "../services/void.service.js";

/**
 * @desc    File an error correction request for a specific transaction
 * @route   POST /api/void-requests
 * @access  Private (Clerk Only)
 */
export const fileVoidRequest = asyncHandler(async (req, res) => {
  const { transactionId, reason } = req.body;
  const clerkId = req.user.id;

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
