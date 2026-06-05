import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as materialService from "../services/material.service.js";

/**
 * @desc    Create new stone material profile
 * @route   POST /api/materials
 * @access  Private (Owner Only)
 */
export const createMaterial = asyncHandler(async (req, res) => {
  const { name, ratePerTon } = req.body;
  const newMaterial = await materialService.addMaterialType({
    name,
    ratePerTon,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newMaterial,
        "New material category onboarded successfully",
      ),
    );
});

/**
 * @desc    Get listing of active materials for form selections
 * @route   GET /api/materials
 * @access  Private (Clerk, Supervisor, Owner)
 */
export const listMaterials = asyncHandler(async (req, res) => {
  const activeMaterials = await materialService.getAllActiveMaterials();

  return res
    .status(200)
    .json(
      new ApiResponse(200, activeMaterials, "Active material logs retrieved"),
    );
});

/**
 * @desc    Modify pricing or active visibility status of a material
 * @route   PATCH /api/materials/:id
 * @access  Private (Owner Only)
 */
export const editMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedMaterial = await materialService.updateMaterialType(
    id,
    req.body,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedMaterial,
        "Material properties adjusted successfully",
      ),
    );
});
