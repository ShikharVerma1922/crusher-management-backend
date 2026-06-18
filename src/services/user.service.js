import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

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
  const userExists = await prisma.user.findUnique({
    where: { username: username },
  });
  if (!userExists) throw new ApiError(401, "USER_NOT_FOUND");

  return await prisma.user.update({
    where: { username: username },
    data: {
      ...(updatePayload.name && { name: updatePayload.name.trim() }),
      ...(typeof updatePayload.isActive === "boolean" && {
        isActive: updatePayload.isActive,
      }),
      ...(updatePayload.role && { role: updatePayload.role }),
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
    },
  });
};
