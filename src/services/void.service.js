import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * File a brand new correction/void request for a transaction mistake
 */
export const createRequest = async ({ transactionId, reason, clerkId }) => {
  // 1. Verify the transaction exists and isn't already voided
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new ApiError(404, "Target transaction record not found.");
  }
  if (transaction.isVoided) {
    throw new ApiError(400, "This transaction has already been voided.");
  }

  // 2. Prevent duplicate pending requests for the same transaction
  const existingRequest = await prisma.voidRequest.findUnique({
    where: { transactionId },
  });

  if (existingRequest) {
    throw new ApiError(
      400,
      `A correction request already exists for this ticket with status: ${existingRequest.status}`,
    );
  }

  // 3. Create the request ledger record
  return await prisma.voidRequest.create({
    data: {
      transactionId,
      reason: reason.trim(),
      clerkId,
    },
    include: {
      transaction: true,
    },
  });
};

/**
 * Pull all open, unresolved clerk correction requests for management view
 */
export const getPendingRequests = async () => {
  return await prisma.voidRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      requestedBy: { select: { name: true } },
      transaction: {
        include: {
          material: {
            select: { name: true },
          },
          customer: { select: { name: true } },
        },
      },
    },
  });
};

/**
 * Process an administrative action (APPROVE or REJECT) on a void request
 */
export const actionRequest = async (
  requestId,
  { status, adminNotes, adminId },
) => {
  const request = await prisma.voidRequest.findUnique({
    where: { id: requestId },
    include: {
      transaction: {
        select: {
          customerId: true,
          balance: true,
        },
      },
    },
  });

  if (!request) {
    throw new ApiError(404, "Correction request not found.");
  }
  if (request.status !== "PENDING") {
    throw new ApiError(
      400,
      "This correction request has already been processed.",
    );
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update the request status properties
    const updatedRequest = await tx.voidRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminNotes: adminNotes?.trim(),
        adminId,
      },
    });

    // 2. IF approved, completely flag off the target transaction from standard totals
    if (status === "APPROVED") {
      await tx.transaction.update({
        where: { id: request.transactionId },
        data: { isVoided: true },
      });

      await tx.customer.update({
        where: { id: request.transaction.customerId },
        data: {
          outstandingBalance: {
            decrement: request.transaction.balance,
          },
        },
      });
    }

    return updatedRequest;
  });
};

/**
 * Fetch resolved void history records filtered by status
 */
export const getResolvedVoidHistory = async (status, page = 1, limit = 10) => {
  const skipCount = (page - 1) * limit;

  // Run a concurrent database operation block to protect performance speeds
  const [totalCount, records] = await prisma.$transaction([
    prisma.voidRequest.count({ where: { status } }),
    prisma.voidRequest.findMany({
      where: { status },
      skip: skipCount,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        requestedBy: { select: { name: true } },
        transaction: {
          include: {
            material: {
              select: { name: true },
            },
            customer: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return {
    records,
    pagination: {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
    },
  };
};

export const directVoidTransaction = async (
  transactionId,
  { adminId, reason },
) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      customerId: true,
      balance: true,
      isVoided: true,
    },
  });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found.");
  }

  if (transaction.isVoided) {
    throw new ApiError(400, "This transaction has already been voided.");
  }

  return await prisma.$transaction(async (tx) => {
    await tx.voidRequest.create({
      data: {
        transaction: {
          connect: {
            id: transactionId,
          },
        },
        requestedBy: {
          connect: {
            id: adminId,
          },
        },
        actionedBy: {
          connect: {
            id: adminId,
          },
        },
        reason: reason?.trim() || "Admin Privilege",
        status: "APPROVED",
        adminNotes: "Voided directly by administrator.",
      },
    });

    const updatedTransaction = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        isVoided: true,
      },
    });

    await tx.customer.update({
      where: { id: transaction.customerId },
      data: {
        outstandingBalance: {
          decrement: transaction.balance,
        },
      },
    });

    return updatedTransaction;
  });
};
