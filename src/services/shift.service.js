import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getClosedShiftsHistorySummary = async (page = 1, limit = 10) => {
  const skipValue = (Number(page) - 1) * Number(limit);

  const [shifts, totalCount] = await prisma.$transaction([
    prisma.shift.findMany({
      where: { status: "CLOSED" },
      include: {
        user: { select: { name: true, username: true } },
      },
      orderBy: { closedAt: "desc" },
      skip: skipValue,
      take: Number(limit),
    }),
    prisma.shift.count({ where: { status: "CLOSED" } }),
  ]);

  return {
    shifts,
    totalPages: Math.ceil(totalCount / Number(limit)),
    totalCount,
  };
};
