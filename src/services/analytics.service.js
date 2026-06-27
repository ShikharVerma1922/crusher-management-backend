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
      netWeight: true, // Total weight in KG
      totalAmount: true, // Total revenue in INR
    },
    _count: {
      id: true, // Total number of truck loads cleared
    },
  });

  // Convert Net Weight sum safely from KG to Metric Tons (1 MT = 1000 KG)
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
    // Default fallback boundary: Last 30 Days
    startDate.setDate(now.getDate() - 30);
  }

  // Clean hours to look back safely from the absolute start of that calendar morning
  startDate.setHours(0, 0, 0, 0);

  // 2. Query the ledger database using high-speed Prisma groupings
  const dailyRawGroups = await prisma.transaction.groupBy({
    by: ["createdAt"],
    where: {
      isVoided: false,
      createdAt: { gte: startDate },
    },
    _sum: {
      netWeight: true, // Combined mass in KG
      totalAmount: true, // Combined billing value in INR
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

    const revenueAmount = group._sum.totalAmount || 0;
    const weightInKG = group._sum.netWeight || 0;
    const tonnageAmount = Math.round((weightInKG / 1000) * 100) / 100;

    if (!bucketMap[formattedLabel]) {
      bucketMap[formattedLabel] = {
        timelineLabel: formattedLabel,
        revenue: 0,
        tonnage: 0,
      };
    }

    bucketMap[formattedLabel].revenue += revenueAmount;
    bucketMap[formattedLabel].tonnage += tonnageAmount;
  });

  // Return values compiled into a sorted chronological array sequence
  return Object.values(bucketMap);
};
