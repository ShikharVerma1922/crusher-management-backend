import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Add a brand new material type to the plant registry
 */
export const addMaterialType = async ({ name, ratePerTon }) => {
  const normalizedName = name.trim().toUpperCase();

  const existingMaterial = await prisma.material.findUnique({
    where: { name: normalizedName },
  });

  if (existingMaterial) {
    throw new ApiError(
      400,
      `Material style '${normalizedName}' already exists.`,
    );
  }

  return await prisma.material.create({
    data: {
      name: normalizedName,
      ratePerTon: parseFloat(ratePerTon),
    },
  });
};

/**
 * Fetch all active materials (Used by both Clerks in dropdowns & Owners)
 */
export const getAllActiveMaterials = async () => {
  return await prisma.material.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
};

/**
 * Update the selling rate or deactivate an existing material
 */
export const updateMaterialType = async (id, { ratePerTon, isActive }) => {
  const existingMaterial = await prisma.material.findUnique({ where: { id } });
  if (!existingMaterial) {
    throw new ApiError(404, "Material not found");
  }

  const updateData = {};
  if (ratePerTon !== undefined) updateData.ratePerTon = parseFloat(ratePerTon);
  if (isActive !== undefined) updateData.isActive = isActive;

  return await prisma.material.update({
    where: { id },
    data: updateData,
  });
};
