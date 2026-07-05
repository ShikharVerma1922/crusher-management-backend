import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as analyticsService from "../services/analytics.service.js";

/**
 * @desc    Get macro vital performance stats for dashboard indicators
 * @route   GET /api/analytics/summary
 * @access  Private (Owner Only)
 */

export const getDashboardSummary = async (req, res) => {
  try {
    // Extract parameters directly: /api/analytics?startDate=...&endDate=...
    const { startDate, endDate } = req.query;

    // Execute operations service layer matching parameters directly
    const summaryMetrics = await analyticsService.getSummaryMetrics(
      startDate,
      endDate,
    );

    // Fallback: Pass dates down into material breakdowns if you want that matching range filtered too!
    const materialMetrics = await analyticsService.getMaterialBreakdownMetrics(
      startDate,
      endDate,
    );

    return res.status(200).json({
      success: true,
      data: {
        summary: summaryMetrics,
        materials: materialMetrics,
      },
    });
  } catch (error) {
    console.error("❌ [Analytics Route Handling Error]:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal backend error processing transaction calculations.",
    });
  }
};

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

export const getAnalyticsTrends = asyncHandler(async (req, res) => {
  const { preset } = req.query;

  const trendTimelineArray =
    await analyticsService.getAnalyticsTrendData(preset);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        trendTimelineArray,
        "Trend timeline fetched successfully",
      ),
    );
});
