import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Create a new weighbridge transaction record
 */
export const createTransactionRecord = async ({
  receiptNumber,
  vehicleNumber,
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
  businessDate,
  clerkId,
  rateStatus = "SETTLED",
}) => {
  const normalizedReceiptNumber = receiptNumber?.trim();
  const normalizedVehicleNumber = vehicleNumber?.toUpperCase().trim();
  const normalizedCustomerName = customerName?.trim();
  const normalizedRateStatus = (rateStatus || "SETTLED").toUpperCase();

  if (
    !normalizedReceiptNumber ||
    !normalizedVehicleNumber ||
    !normalizedCustomerName ||
    materialQuantity === undefined ||
    materialQuantity === null ||
    materialQuantity === "" ||
    !paymentMode
  ) {
    throw new ApiError(400, "Required operational parameters are missing.");
  }

  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });

  if (!material?.isActive) {
    throw new ApiError(
      404,
      "Selected material is invalid or no longer active.",
    );
  }

  if (paymentMode === "CASH" && normalizedRateStatus === "OPEN") {
    throw new ApiError(
      400,
      "CASH payment tickets must have an immediate settled rate.",
    );
  }

  const parsedMaterialQuantity = Number(materialQuantity);
  const parsedMaterialRate = Number(materialRate);
  const parsedRoyaltyQuantity = Number(royaltyQuantity);
  const parsedRoyaltyRate = Number(royaltyRate);
  const parsedAmountPaid = Number(amountPaid);

  let materialAmount = 0;
  let royaltyAmount = 0;

  if (normalizedRateStatus === "SETTLED") {
    materialAmount = Number(
      (parsedMaterialQuantity * parsedMaterialRate).toFixed(2),
    );
  }

  if (parsedRoyaltyQuantity > 0 && parsedRoyaltyRate > 0) {
    royaltyAmount = Number(
      (parsedRoyaltyQuantity * parsedRoyaltyRate).toFixed(2),
    );
  }

  const grandTotal = Number((materialAmount + royaltyAmount).toFixed(2));
  let balance = Number((grandTotal - parsedAmountPaid).toFixed(2));
  if (Object.is(balance, -0)) {
    balance = 0;
  }

  return prisma.$transaction(async (tx) => {
    let customer = await tx.customer.findUnique({
      where: { name: normalizedCustomerName },
    });

    if (!customer) {
      try {
        customer = await tx.customer.create({
          data: {
            name: normalizedCustomerName,
            outstandingBalance: balance,
          },
        });
      } catch (error) {
        if (error?.code !== "P2002") {
          throw error;
        }

        customer = await tx.customer.update({
          where: { name: normalizedCustomerName },
          data: {
            outstandingBalance: {
              increment: balance,
            },
          },
        });
      }
    } else {
      customer = await tx.customer.update({
        where: { name: normalizedCustomerName },
        data: {
          outstandingBalance: {
            increment: balance,
          },
        },
      });
    }

    return tx.transaction.create({
      data: {
        receiptNumber: normalizedReceiptNumber,
        vehicleNumber: normalizedVehicleNumber,
        materialQuantity: parsedMaterialQuantity,
        materialRate: normalizedRateStatus === "OPEN" ? 0 : parsedMaterialRate,
        materialAmount,
        royaltyQuantity: parsedRoyaltyQuantity,
        royaltyRate: parsedRoyaltyRate,
        royaltyAmount,
        grandTotal,
        paymentMode,
        amountPaid: parsedAmountPaid,
        balance,
        rateStatus: normalizedRateStatus,
        site,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        businessDate: businessDate ? new Date(businessDate) : null,
        customer: {
          connect: {
            id: customer.id,
          },
        },
        clerk: {
          connect: {
            id: clerkId,
          },
        },
        material: {
          connect: {
            id: material.id,
          },
        },
      },
      include: {
        material: { select: { name: true } },
        clerk: { select: { name: true } },
        customer: { select: { name: true } },
      },
    });
  });
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
      {
        customer: { name: { contains: formattedSearch, mode: "insensitive" } },
      },
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
          customer: { select: { name: true } },
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

// for excel export
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
        customer: {
          name: {
            contains: formattedSearch,
            mode: "insensitive",
          },
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
      customer: {
        select: {
          name: true,
        },
      },
    },
  });

  return transactions;
};

// get all unsettled transactions
export const getUnvaluedTransactions = async ({ search, material }) => {
  const whereClause = {
    isVoided: false,
    rateStatus: "OPEN",
  };

  if (search) {
    const formattedSearch = search.trim();
    whereClause.OR = [
      { vehicleNumber: { contains: formattedSearch.toUpperCase().trim() } },
      {
        customer: { name: { contains: formattedSearch, mode: "insensitive" } },
      },
      { receiptNumber: { startsWith: formattedSearch, mode: "insensitive" } },
      { site: { contains: formattedSearch, mode: "insensitive" } },
    ];
  }

  if (material) {
    whereClause.materialId = material;
  }

  const [transactions, totalCount, volumeAggregation] =
    await prisma.$transaction([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { businessDate: "asc" },
        include: {
          material: { select: { name: true } },
          clerk: { select: { name: true } },
          customer: { select: { name: true } },
        },
      }),

      prisma.transaction.count({ where: whereClause }),

      prisma.transaction.aggregate({
        where: whereClause,
        _sum: {
          materialQuantity: true,
        },
      }),
    ]);

  const totalVolume = volumeAggregation._sum.materialQuantity || 0;

  // Format array payload safely so frontend inputs bind cleanly without throwing undefined metrics
  const formattedTransactions = transactions.map((tx) => ({
    id: tx.id,
    receiptNumber: tx.receiptNumber,
    businessDate: tx.businessDate.toISOString().split("T")[0], // Extract clean YYYY-MM-DD
    customerName: tx.customer?.name || "Unknown Customer",
    customerId: tx.customerId,
    vehicleNumber: tx.vehicleNumber,
    site: tx.site,
    material: tx.material?.name || "Aggregate",
    materialQuantity: tx.materialQuantity,
    royaltyQuantity: tx.royaltyQuantity || 0,
    royaltyRate: tx.royaltyRate || 0,
    royaltyAmount: tx.royaltyAmount || 0,
    amountPaid: tx.amountPaid || 0,
    materialRate: "", // Pushed empty string initialization hook for frontend input fields
  }));

  return {
    transactions: formattedTransactions,
    meta: {
      totalCount,
      totalVolume,
    },
  };
};

// settle rate logic
export const batchSettleTransactions = async ({ items }) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error(
      "Invalid payload standard: 'items' data array is required.",
    );
  }

  // Atomic pipeline validation layer
  return await prisma.$transaction(async (tx) => {
    const settlementResults = [];

    for (const item of items) {
      const { id, materialRate } = item;
      const parsedRate = parseFloat(materialRate);

      if (isNaN(parsedRate) || parsedRate <= 0) {
        throw new Error(
          `Invalid transaction pricing assignment rule specified for row ID: ${id}`,
        );
      }

      const currentTx = await tx.transaction.findUnique({
        where: { id },
        select: {
          materialQuantity: true,
          royaltyQuantity: true,
          royaltyRate: true,
          amountPaid: true,
        },
      });

      if (!currentTx) {
        throw new Error(
          `Target dispatch execution row reference ${id} not found.`,
        );
      }

      // 📊 Corporate Commodity Math Formulas
      const materialAmount = currentTx.materialQuantity * parsedRate;
      const royaltyAmount =
        currentTx.royaltyQuantity * (currentTx.royaltyRate || 0);
      const grandTotal = materialAmount + royaltyAmount;
      const balance = grandTotal - currentTx.amountPaid;

      // Update structural values and break the isolation block
      const updatedRecord = await tx.transaction.update({
        where: { id },
        data: {
          materialRate: parsedRate,
          materialAmount: materialAmount,
          grandTotal: grandTotal,
          balance: balance,
          rateStatus: "SETTLED",
        },
      });

      settlementResults.push(updatedRecord);
    }

    return {
      success: true,
      settledCount: settlementResults.length,
    };
  });
};
