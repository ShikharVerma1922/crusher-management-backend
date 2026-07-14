import prisma from "../config/prisma.js";

/**
 * Compile high-level operational vital statistics (Revenue, Tonnage, Truck Count)
 */
export const getSummaryMetrics = async (startDateStr, endDateStr) => {
  // Build a dynamic filtering condition block matching your core ledger rules
  const whereClause = { isVoided: false };

  // Apply absolute ISO boundaries if provided by the incoming query request parameters
  if (startDateStr || endDateStr) {
    whereClause.createdAt = {};
    if (startDateStr) whereClause.createdAt.gte = new Date(startDateStr);
    if (endDateStr) whereClause.createdAt.lte = new Date(endDateStr);
  }

  // 1. Run highly optimized aggregation commands directly inside PostgreSQL/MySQL
  const aggregates = await prisma.transaction.aggregate({
    where: whereClause,
    _sum: {
      materialQuantity: true,
      grandTotal: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    totalRevenue: aggregates._sum.grandTotal || 0,
    totalQuantity: aggregates._sum.materialQuantity || 0,
    totalTrucksCleared: aggregates._count.id || 0,
  };
};

/**
 * Breakdown plant output and revenue segmented by individual material types
 */
export const getMaterialBreakdownMetrics = async (startDateStr, endDateStr) => {
  const whereClause = { isVoided: false };

  if (startDateStr || endDateStr) {
    whereClause.createdAt = {};
    if (startDateStr) whereClause.createdAt.gte = new Date(startDateStr);
    if (endDateStr) whereClause.createdAt.lte = new Date(endDateStr);
  }
  // Group rows by material configuration layout structures
  const dataGroups = await prisma.transaction.groupBy({
    by: ["materialId"],
    where: whereClause,
    _sum: {
      materialQuantity: true,
      grandTotal: true,
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
    revenueGenerated: group._sum.grandTotal || 0,
    totalQuantity: group._sum.materialQuantity || 0,
    truckCount: group._count.id || 0,
  }));
};

/**
 * Compile chronological trend timelines broken down into periodic buckets
 */
export const getAnalyticsTrendData = async (preset) => {
  const now = new Date();
  let startDate = new Date();

  // 1. Establish the historical window boundary based on the preset query parameter
  if (preset === "last_7_days") {
    startDate.setDate(now.getDate() - 7);
  } else if (preset === "last_6_months") {
    startDate.setMonth(now.getMonth() - 6);
  } else {
    startDate.setDate(now.getDate() - 30);
  }

  startDate.setHours(9, 0, 0, 0);

  // 2. Query the ledger database using high-speed Prisma groupings
  const dailyRawGroups = await prisma.transaction.groupBy({
    by: ["createdAt"],
    where: {
      isVoided: false,
      createdAt: { gte: startDate },
    },
    _sum: {
      materialQuantity: true,
      grandTotal: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // 3. Normalize database timelines into structured day-by-day intervals
  // This squashes database timestamps into simple localized "DD MMM" buckets (e.g., "19 Jun")
  const bucketMap = {};

  dailyRawGroups.forEach((group) => {
    const dateObj = new Date(group.createdAt);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = dateObj.toLocaleString("en-US", { month: "short" });
    const formattedLabel = `${day} ${month}`;

    const revenueAmount = group._sum.grandTotal || 0;
    const totalQuantity = group._sum.materialQuantity || 0;

    if (!bucketMap[formattedLabel]) {
      bucketMap[formattedLabel] = {
        timelineLabel: formattedLabel,
        revenue: 0,
        materialQuantity: 0,
      };
    }

    bucketMap[formattedLabel].revenue += revenueAmount;
    bucketMap[formattedLabel].materialQuantity += totalQuantity;
  });

  // Return values compiled into a sorted chronological array sequence
  return Object.values(bucketMap);
};
