import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export const getAllCustomers = async () => {
  const customers = await prisma.customer.findMany();

  return customers;
};

export const getCustomerRunningLedger = async ({ customerId, from, to }) => {
  const startDate = from
    ? new Date(`${from}T00:00:00`)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const endDate = to ? new Date(`${to}T23:59:59.999`) : new Date();

  if (!to) {
    endDate.setHours(23, 59, 59, 999);
  }

  // ==========================================
  // STAGE 1: Calculate Opening Balance B/F
  // (Accumulate all past debits/credits before startDate)
  // ==========================================

  // 1. Fetch Customer's static base configuration legacy debt (if implemented)
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { initialOpeningBalance: true, name: true },
  });

  if (!customer) {
    throw new ApiError(404, "Customer record not found.");
  }

  const legacyOpeningBalance = customer.initialOpeningBalance || 0;

  // 2. Sum of all historical Transaction Debits
  const historicalDebits = await prisma.transaction.aggregate({
    where: {
      customerId,
      isVoided: false,
      createdAt: { lt: startDate },
    },
    _sum: {
      balance: true,
    },
  });

  // 3. Sum of all historical Payment Credits before the requested date window
  const historicalCredits = await prisma.payment.aggregate({
    where: {
      customerId,
      createdAt: { lt: startDate },
    },
    _sum: {
      amountPaid: true,
    },
  });

  const totalDebitsBefore = historicalDebits._sum.balance || 0;
  const totalCreditsBefore = historicalCredits._sum.amountPaid || 0;

  const openingBalance =
    legacyOpeningBalance + totalDebitsBefore - totalCreditsBefore;

  // ==========================================
  // STAGE 2: Fetch Matching Period Records
  // ==========================================

  // Fetch transactions within the period
  const periodTransactions = await prisma.transaction.findMany({
    where: {
      customerId,
      isVoided: false,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      receiptNumber: true,
      vehicleNumber: true,
      grandTotal: true,
      amountPaid: true,
      balance: true, // The net debit of this invoice
      createdAt: true,
      rateStatus: true,
      material: { select: { name: true } },
    },
  });

  // Fetch payments within the period
  const periodPayments = await prisma.payment.findMany({
    where: {
      customerId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      receiptNumber: true,
      amountPaid: true,
      paymentMode: true,
      referenceNo: true,
      createdAt: true,
    },
  });

  // ==========================================
  // STAGE 3: Merge, Sort & Construct Ledger Rows
  // ==========================================

  // Map Invoices to standard Ledger Debit Items
  const formattedInvoices = periodTransactions.map((tx) => ({
    id: tx.id,
    type: "DEBIT",
    date: tx.createdAt,
    referenceNumber: tx.receiptNumber,
    particulars: `${tx.material?.name || "Material"}${tx.vehicleNumber ? ` - ${tx.vehicleNumber}` : ""}`,
    debit: tx.balance,
    credit: 0.0,
    amount: tx.balance,
    rateStatus: tx.rateStatus,
  }));

  // Map Payments to standard Ledger Credit Items
  const formattedPayments = periodPayments.map((p) => ({
    id: p.id,
    type: "CREDIT",
    date: p.createdAt,
    referenceNumber: p.receiptNumber,
    particulars: `${p.paymentMode} Received${p.referenceNo ? ` (${p.referenceNo})` : ""}`,
    debit: 0.0,
    credit: p.amountPaid,
    amount: p.amountPaid,
  }));

  // Combine and sort chronological ledger items
  const ledgerItems = [...formattedInvoices, ...formattedPayments].sort(
    (a, b) => {
      const diff = new Date(a.date) - new Date(b.date);
      if (diff !== 0) return diff;
      if (a.type === b.type) return 0;
      return a.type === "DEBIT" ? -1 : 1;
    },
  );

  // ==========================================
  // STAGE 4: Calculate Closing Balance
  // ==========================================
  const periodDebits = ledgerItems.reduce((acc, curr) => acc + curr.debit, 0);
  const periodCredits = ledgerItems.reduce((acc, curr) => acc + curr.credit, 0);

  const closingBalance = openingBalance + periodDebits - periodCredits;

  // Return the response payload
  return {
    customerName: customer.name,
    openingBalance,
    closingBalance,
    items: ledgerItems,
  };
};
