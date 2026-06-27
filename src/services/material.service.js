import { response } from "express";
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
      `Material varient '${normalizedName}' already exists.`,
    );
  }

  return await prisma.material.create({
    data: {
      name: normalizedName,
    },
  });
};

/**
 * Fetch all active materials for clerk
 */
export const getAllActiveMaterialsClerk = async () => {
  const response = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return response;
};

/**
 * Fetch all active materials for owner
 */

export const getAllActiveMaterialsOwner = async () => {
  const response = await prisma.material.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return response;
};

/**
 * Update the selling rate or deactivate an existing material
 */
export const updateMaterialType = async (id, { name, isActive }) => {
  const existingMaterial = await prisma.material.findUnique({ where: { id } });
  if (!existingMaterial) {
    throw new ApiError(404, "Material not found");
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (isActive !== undefined) updateData.isActive = isActive;

  return await prisma.material.update({
    where: { id },
    data: updateData,
  });
};
