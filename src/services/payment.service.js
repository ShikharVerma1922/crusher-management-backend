import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export const createPaymentRecord = async ({
  customerId,
  amountPaid,
  paymentMode,
  referenceNo,
  remarks,
  paymentDate,
  businessDate,
}) => {
  // 1. Validation
  if (
    !customerId ||
    !amountPaid ||
    isNaN(amountPaid) ||
    parseFloat(amountPaid) <= 0 ||
    !paymentDate ||
    !businessDate
  ) {
    throw new ApiError(400, "Invalid payment payload parameters.");
  }

  const paymentVal = parseFloat(amountPaid);
  console.log(customerId);
  const parsedPaymentDate = new Date(paymentDate);
  const parsedBusinessDate = new Date(businessDate);
  // 2. Execute atomic ledger transaction update
  const result = await prisma.$transaction(async (tx) => {
    // A. Verify customer exists
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
    });
    console.log(customer);
    if (!customer) {
      throw new Error("Customer record not found.");
    }

    // B. Generate unique receipt voucher token (e.g., REC-10004)
    const paymentCount = await tx.payment.count();
    console.log(paymentCount);
    const receiptNumber = `${10001 + paymentCount}`;

    // C. Record payment voucher to ledger DB
    const newPayment = await tx.payment.create({
      data: {
        customerId,
        receiptNumber,
        amountPaid: paymentVal,
        paymentMode,
        referenceNo: referenceNo || null,
        remarks: remarks || null,
        paymentDate: parsedPaymentDate,
        businessDate: parsedBusinessDate,
      },
    });

    // D. Atomically reduce customer's outstanding balance
    const updatedCustomer = await tx.customer.update({
      where: { id: customerId },
      data: {
        outstandingBalance: {
          decrement: paymentVal,
        },
      },
    });
    console.log(updatedCustomer.outstandingBalance);
    return { newPayment, updatedCustomer };
  });

  return {
    receiptNumber: result.newPayment.receiptNumber,
    newBalance: result.updatedCustomer.outstandingBalance,
  };
};

export const getAllPayments = async ({
  page = 1,
  limit = 10,
  search,
  startDate,
  endDate,
}) => {
  const skip = (page - 1) * limit;

  const whereClause = { isVoided: false };

  if (search) {
    const formattedSearch = search.trim();

    whereClause.OR = [
      {
        customer: { name: { contains: formattedSearch, mode: "insensitive" } },
      },
      { receiptNumber: { startsWith: formattedSearch, mode: "insensitive" } },
    ];
  }

  if (startDate || endDate) {
    whereClause.paymentDate = {};
    if (startDate) whereClause.paymentDate.gte = new Date(startDate);
    if (endDate) whereClause.paymentDate.lte = new Date(endDate);
  }

  // 🚀 Added raw groupings to aggregate financial metrics in parallel execution
  const [payments, totalCount] = await prisma.$transaction([
    // Paginated Transactions list
    prisma.payment.findMany({
      where: whereClause,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        receivedBy: { select: { name: true } },
        customer: { select: { name: true } },
      },
    }),

    // Total Count for Pagination
    prisma.payment.count({ where: whereClause }),
  ]);

  return {
    payments,
    meta: {
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

export const exportGlobalPayments = async ({ search, startDate, endDate }) => {
  const whereClause = { isVoided: false };

  if (search) {
    const formattedSearch = search.trim();

    whereClause.OR = [
      {
        customer: { name: { contains: formattedSearch, mode: "insensitive" } },
      },
      { receiptNumber: { startsWith: formattedSearch, mode: "insensitive" } },
    ];
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = new Date(startDate);
    if (endDate) whereClause.createdAt.lte = new Date(endDate);
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
    include: {
      receivedBy: { select: { name: true } },
      customer: { select: { name: true } },
    },
  });

  return payments;
};
