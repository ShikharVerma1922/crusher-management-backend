import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as analyticsService from "../services/analytics.service.js";

/**
 * @desc    Get macro vital performance stats for dashboard indicators
 * @route   GET /api/analytics/summary
 * @access  Private (Owner Only)
 */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const { range } = req.query; // Expects values like 'today' or 'month'

  const metrics = await analyticsService.getSummaryMetrics(range);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        metrics,
        `Plant summary report compiled for range scope: [${range || "all-time"}]`,
      ),
    );
});

/**
 * @desc    Get output breakdowns grouped by material category sizes
 * @route   GET /api/analytics/materials
 * @access  Private (Owner Only)
 */
export const getMaterialAnalytics = asyncHandler(async (req, res) => {
  const breakdown = await analyticsService.getMaterialBreakdownMetrics();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        breakdown,
        "Product category sales summaries calculated successfully",
      ),
    );
});
