import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcryptjs";

// Query All Registered Clerks
export const getAllClerksFromLedger = async () => {
  return await prisma.user.findMany({
    where: { role: "CLERK" },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

// 3. Administrative Target Profile Update/Deactivation
export const updateUserProfileData = async (username, updatePayload) => {
  // 1. Fetch the profile first to audit their role level
  const userExists = await prisma.user.findUnique({
    where: { username: username },
  });

  if (!userExists) {
    throw new ApiError(404, "USER_NOT_FOUND");
  }

  // 🛡️ THE SECURITY GATE: Prevent changes to any profile that isn't a clerk
  if (userExists.role === "OWNER") {
    throw new ApiError(
      403,
      "UNAUTHORIZED_ACTION: Owners cannot modify other Owner profiles.",
    );
  }

  // 2. Build our dynamic Prisma database payload update block
  const updateData = {};

  if (updatePayload.name) {
    updateData.name = updatePayload.name.trim();
  }

  if (typeof updatePayload.isActive === "boolean") {
    updateData.isActive = updatePayload.isActive;
  }

  // 🔐 THE PASSWORD OVERWRITE: Hashes the text before it ever hits PostgreSQL/MySQL
  if (updatePayload.password && updatePayload.password.trim().length > 0) {
    const saltRounds = 10;
    updateData.password = await bcrypt.hash(
      updatePayload.password.trim(),
      saltRounds,
    );
  }

  // 3. Commit the verified changes to the database safely
  return await prisma.user.update({
    where: { username: username },
    data: updateData,
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
    },
  });
};
