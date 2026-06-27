import * as shiftService from "../services/shiftService.js";

export const handleGetShiftHistory = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const historyData = await shiftService.getClosedShiftsHistorySummary(
      page || 1,
      limit || 10,
    );
    return res.status(200).json({ success: true, ...historyData });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to isolate shift summary registers.",
      });
  }
};
