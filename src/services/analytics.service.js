import prisma from "../config/prisma.js";

/**
 * Compile high-level operational vital statistics (Revenue, Tonnage, Truck Count)
 */
export const getSummaryMetrics = async (range) => {
  const findStartDate = () => {
    const now = new Date();
    if (range === "today") return new Date(now.setHours(0, 0, 0, 0));
    if (range === "month")
      return new Date(now.getFullYear(), now.getMonth(), 1);
    return new Date(0); // All-time fallback
  };

  const startDate = findStartDate();

  // 1. Calculate combined total financial and tonnage metrics
  const aggregates = await prisma.transaction.aggregate({
    where: {
      isVoided: false,
      createdAt: { gte: startDate },
    },
    _sum: {
      netWeight: true, // Total weight in KG
      totalAmount: true, // Total gross revenue in INR
    },
    _count: {
      id: true, // Total number of truck loads cleared
    },
  });

  // Convert Net Weight sum from KG to Metric Tons (1 Ton = 1000 KG)
  const totalWeightInKG = aggregates._sum.netWeight || 0;
  const totalTonnage = Math.round((totalWeightInKG / 1000) * 100) / 100;

  return {
    totalRevenue: aggregates._sum.totalAmount || 0,
    totalTonnageShifted: totalTonnage,
    totalTrucksCleared: aggregates._count.id || 0,
  };
};

/**
 * Breakdown plant output and revenue segmented by individual material types
 */
export const getMaterialBreakdownMetrics = async () => {
  // Group rows by material configuration layout structures
  const dataGroups = await prisma.transaction.groupBy({
    by: ["materialId"],
    where: { isVoided: false },
    _sum: {
      netWeight: true,
      totalAmount: true,
    },
    _count: {
      id: true,
    },
  });

  // Fetch material names to map back to the raw UUID groups
  const materials = await prisma.material.findMany({
    select: { id: true, name: true },
  });

  const materialMap = new Map(materials.map((m) => [m.id, m.name]));

  // Combine data arrays into clean UI charting structures
  return dataGroups.map((group) => ({
    materialId: group.materialId,
    materialName: materialMap.get(group.materialId) || "Unknown Category",
    revenueGenerated: group._sum.totalAmount || 0,
    tonnageShifted:
      Math.round(((group._sum.netWeight || 0) / 1000) * 100) / 100,
    truckCount: group._count.id || 0,
  }));
};
