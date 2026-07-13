import { custom, startsWith } from "zod";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Create a new weighbridge transaction record
 */
export const createTransactionRecord = async ({
  receiptNumber,
  vehicleNumber,
  customerId,
  customerName,
  materialQuantity,
  materialRate = 0,
  royaltyQuantity = 0,
  royaltyRate = 0,
  amountPaid = 0,
  paymentMode,
  site,
  materialId,
  createdAt,
  clerkId,
  rateStatus = "SETTLED",
}) => {
  // 1. Strict Validation Check
  if (
    !receiptNumber ||
    !vehicleNumber ||
    !customerId ||
    !customerName ||
    !materialQuantity ||
    !materialId ||
    !paymentMode
  ) {
    throw new ApiError(400, "Required operational parameters are missing.");
  }

  // 2. Validate Material Asset
  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });
  if (!material || !material.isActive) {
    throw new ApiError(
      404,
      "Selected material is invalid or no longer active.",
    );
  }

  // 3. Cash Gate Constraints
  const targetRateStatus = rateStatus?.toUpperCase() || "SETTLED";
  if (paymentMode === "CASH" && targetRateStatus === "OPEN") {
    throw new ApiError(
      400,
      "CASH payment tickets must have an immediate settled rate.",
    );
  }

  // 4. Mathematical Computations
  let materialAmount = 0;
  let royaltyAmount = 0;

  if (targetRateStatus === "SETTLED") {
    materialAmount = Number(materialRate) * Number(materialQuantity);
  }

  if (royaltyQuantity && royaltyRate) {
    royaltyAmount = Number(royaltyQuantity) * Number(royaltyRate);
  }

  const grandTotal = materialAmount + royaltyAmount;
  const balance = grandTotal - Number(amountPaid);

  // 5. Atomic Database Transaction (Maintains Ledger Safety)
  const newTransaction = await prisma.$transaction(async (tx) => {
    // A. Upsert the customer account profile safely initializing balances
    await tx.customer.upsert({
      where: { id: customerId },
      update: {
        outstandingBalance: {
          increment: balance,
        },
      },
      create: {
        id: customerId, // Retain client-generated UUID for offline additions
        name: customerName,
        outstandingBalance: balance, // Capture initial debt footprints on spot
      },
    });

    // B. Generate the locked transaction ticket log
    return await tx.transaction.create({
      data: {
        receiptNumber: receiptNumber.trim(),
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        customerId,
        materialQuantity,
        materialRate: targetRateStatus === "OPEN" ? 0 : materialRate,
        materialAmount,
        royaltyQuantity,
        royaltyRate,
        royaltyAmount,
        grandTotal,
        paymentMode,
        amountPaid,
        balance,
        rateStatus: targetRateStatus,
        clerkId,
        materialId,
        site,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      },
      include: {
        material: { select: { name: true } },
        clerk: { select: { name: true } },
        customer: { select: { name: true } },
      },
    });
  });

  return newTransaction;
};

/**
 * Fetch transaction by ID for safety verification or manual reprint triggers
 */
export const getTransactionById = async (id) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      material: { select: { name: true } },
      clerk: { select: { name: true } },
    },
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction record not found");
  }

  return transaction;
};

/**
 * Fetch all global transactions with advanced administrative filtering
 */
export const getGlobalTransactions = async ({
  page = 1,
  limit = 10,
  search,
  material,
  startDate,
  endDate,
}) => {
  const skip = (page - 1) * limit;

  const whereClause = { isVoided: false };

  if (search) {
    const formattedSearch = search.trim();

    whereClause.OR = [
      { vehicleNumber: { contains: formattedSearch.toUpperCase().trim() } },
      { customerName: { contains: formattedSearch, mode: "insensitive" } },
      { receiptNumber: { startsWith: formattedSearch, mode: "insensitive" } },
      { site: { contains: formattedSearch, mode: "insensitive" } },
    ];
  }

  if (material) {
    // If your schema stores materialId directly on the transaction:
    whereClause.materialId = material;

    // OR if you match by material name string instead, uncomment below:
    // whereClause.material = { name: { contains: material, mode: "insensitive" } };
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  // 🚀 Added raw groupings to aggregate financial metrics in parallel execution
  const [transactions, totalCount, totalsAggregation, cashAggregation] =
    await prisma.$transaction([
      // Paginated Transactions list
      prisma.transaction.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        include: {
          material: { select: { name: true } },
          clerk: { select: { name: true } },
        },
      }),

      // Total Count for Pagination
      prisma.transaction.count({ where: whereClause }),

      // Total Overall Quantity and Cumulative Amount across ALL matching records
      prisma.transaction.aggregate({
        where: whereClause,
        _sum: {
          materialQuantity: true,
          materialAmount: true,
        },
      }),

      // Total Cash Calculation
      prisma.transaction.aggregate({
        where: {
          ...whereClause,
          paymentMode: "CASH",
        },
        _sum: {
          materialAmount: true,
        },
      }),
    ]);

  const totalQuantity = totalsAggregation._sum.materialQuantity || 0;
  const overallTotalAmount = totalsAggregation._sum.materialAmount || 0;
  const totalCash = cashAggregation._sum.materialAmount || 0;
  const totalCredit = overallTotalAmount - totalCash;

  return {
    transactions,
    meta: {
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalQuantity,
      totalCash,
      totalCredit,
    },
  };
};

/**
 * Fetch only the records generated by a specific clerk during their active shift
 */
export const getClerkShiftTransactions = async (clerkId) => {
  // get the transactions for last 12 hours only
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  return await prisma.transaction.findMany({
    where: {
      clerkId,
      createdAt: { gte: twelveHoursAgo },
      isVoided: false,
    },
    orderBy: { createdAt: "desc" },
    include: {
      material: { select: { name: true } },
    },
  });
};

export const getMaxReceiptNumber = async () => {
  const highestTicket = await prisma.transaction.findFirst({
    orderBy: {
      receiptNumber: "desc",
    },
    select: {
      receiptNumber: true,
    },
  });

  return highestTicket ? highestTicket.receiptNumber : 1000;
};

export const editCreditAmount = async ({
  transactionId,
  amount,
  materialQuantity,
}) => {
  const transaction = await prisma.transaction.update({
    where: {
      id: transactionId,
      paymentMode: "CREDIT",
    },
    data: {
      materialAmount: amount,
      materialRate: amount / materialQuantity,
    },
  });

  if (!transaction) throw new ApiError(400, "Transaction does not exist.");

  return transaction;
};

/**
 * Fetch all matching transactions for Excel export (no pagination)
 */
export const exportGlobalTransactions = async ({
  search,
  material,
  startDate,
  endDate,
}) => {
  const whereClause = { isVoided: false };

  if (search) {
    const formattedSearch = search.trim();

    whereClause.OR = [
      {
        vehicleNumber: {
          contains: formattedSearch.toUpperCase(),
        },
      },
      {
        customerName: {
          contains: formattedSearch,
          mode: "insensitive",
        },
      },
      {
        receiptNumber: {
          startsWith: formattedSearch,
          mode: "insensitive",
        },
      },
      {
        site: {
          contains: formattedSearch,
          mode: "insensitive",
        },
      },
    ];
  }

  if (material) {
    whereClause.materialId = material;
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};

    if (startDate) {
      whereClause.createdAt.gte = new Date(startDate);
    }

    if (endDate) {
      whereClause.createdAt.lte = new Date(endDate);
    }
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "asc",
    },
    include: {
      material: {
        select: {
          name: true,
        },
      },
      clerk: {
        select: {
          name: true,
        },
      },
    },
  });

  return transactions;
};
