import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as materialService from "../services/material.service.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * @desc    Create new stone material profile
 * @route   POST /api/materials
 * @access  Private (Owner Only)
 */
export const createMaterial = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new ApiError(400, "Name of the material is required");
  const newMaterial = await materialService.addMaterialType({
    name,
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
 * @access  Private (Clerk)
 */
export const listMaterialsClerk = asyncHandler(async (req, res) => {
  const activeMaterials = await materialService.getAllActiveMaterialsClerk();

  return res
    .status(200)
    .json(
      new ApiResponse(200, activeMaterials, "Active material logs retrieved"),
    );
});

/**
 * @desc    Get listing of active materials for form selections
 * @route   GET /api/materials
 * @access  Private (Owner)
 */
export const listMaterialsOwner = asyncHandler(async (req, res) => {
  const materials = await materialService.getAllActiveMaterialsOwner();

  return res
    .status(200)
    .json(new ApiResponse(200, materials, "Materials logs retrieved"));
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
