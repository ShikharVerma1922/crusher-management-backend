import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export const getAllCustomers = async () => {
  const customers = await prisma.customer.findMany({
    orderBy: {
      outstandingBalance: "desc",
    },
  });

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
      businessDate: { lt: startDate },
    },
    _sum: {
      balance: true,
    },
  });

  // 3. Sum of all historical Payment Credits before the requested date window
  const historicalCredits = await prisma.payment.aggregate({
    where: {
      customerId,
      isVoided: false,
      businessDate: { lt: startDate },
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
      businessDate: {
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
      businessDate: true,
      rateStatus: true,
      materialQuantity: true,
      material: { select: { name: true } },
    },
  });

  // Fetch payments within the period
  const periodPayments = await prisma.payment.findMany({
    where: {
      customerId,
      businessDate: {
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
      paymentDate: true,
      businessDate: true,
    },
  });

  // ==========================================
  // STAGE 3: Merge, Sort & Construct Ledger Rows
  // ==========================================

  // Map Invoices to standard Ledger Debit Items
  const formattedInvoices = periodTransactions.map((tx) => ({
    id: tx.id,
    type: "DEBIT",
    date: tx.businessDate,
    referenceNumber: tx.receiptNumber,
    particulars: `Sale of ${tx.materialQuantity} ft³ ${tx.material?.name || "Material"} ${tx.grandTotal ? ` @ ₹${tx.grandTotal}` : ""}`,
    debit: tx.balance,
    credit: 0.0,
    amount: tx.balance,
    rateStatus: tx.rateStatus,
  }));

  // Map Payments to standard Ledger Credit Items
  const formattedPayments = periodPayments.map((p) => ({
    id: p.id,
    type: "CREDIT",
    date: p.businessDate,
    referenceNumber: p.receiptNumber,
    particulars: `Payment received via ${p.paymentMode}`,
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

export const updateCustomerDetails = async ({
  id,
  name,
  initialOpeningBalance,
  openingBalanceDate,
  creditLimit,
}) => {
  if (!id) throw new ApiError("Customer structural ID argument is required.");

  const parsedOpeningBalance = parseFloat(initialOpeningBalance);
  const parsedCreditLimit = parseFloat(creditLimit);
  const parsedDate = openingBalanceDate ? new Date(openingBalanceDate) : null;

  if (isNaN(parsedOpeningBalance))
    throw new ApiError("Invalid entry for initial opening balance.");
  if (isNaN(parsedCreditLimit) || parsedCreditLimit < 0)
    throw new ApiError("Credit limit must be a valid positive number.");
  // Execute inside an atomic transaction to keep core settings and history synced
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch the current customer state
    const existingCustomer = await tx.customer.findUnique({
      where: { id },
      select: {
        initialOpeningBalance: true,
        outstandingBalance: true,
      },
    });

    if (!existingCustomer) {
      throw new ApiError(404, "Customer record not found.");
    }

    // 2. Calculate the change in opening balance
    const openingBalanceDelta =
      parsedOpeningBalance - existingCustomer.initialOpeningBalance;

    // 3. Apply the delta to the current outstanding balance
    const updatedOutstandingBalance =
      existingCustomer.outstandingBalance + openingBalanceDelta;
    // 4. Update the customer
    const updatedCustomer = await tx.customer.update({
      where: { id },
      data: {
        name: name.trim(),
        initialOpeningBalance: parsedOpeningBalance,
        openingBalanceDate: parsedDate,
        creditLimit: parsedCreditLimit,
        outstandingBalance: updatedOutstandingBalance,
      },
      select: {
        id: true,
        name: true,
        initialOpeningBalance: true,
        openingBalanceDate: true,
        creditLimit: true,
        outstandingBalance: true,
      },
    });
    console.log(updatedCustomer);
    return {
      ...updatedCustomer,
      openingBalanceDate: updatedCustomer.openingBalanceDate
        ? updatedCustomer.openingBalanceDate.toISOString().split("T")[0]
        : null,
    };
  });
};

export const getCustomerDetailsById = async ({ id }) => {
  if (!id) throw new Error("Customer profile ID argument is required.");

  // Execute queries in parallel using your established $transaction design pattern
  const [customer, totalTicketsCount, historicalFinancialSummary] =
    await prisma.$transaction([
      // 1. Fetch main account specifications
      prisma.customer.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          initialOpeningBalance: true,
          openingBalanceDate: true,
          creditLimit: true,
          outstandingBalance: true,
          createdAt: true,
        },
      }),

      // 2. Count total unvoided dispatches associated with this account
      prisma.transaction.count({
        where: {
          customerId: id,
          isVoided: false,
        },
      }),

      // 3. Aggregate tracking parameters for account health analysis
      prisma.transaction.aggregate({
        where: {
          customerId: id,
          isVoided: false,
          rateStatus: "SETTLED",
        },
        _sum: {
          grandTotal: true,
          amountPaid: true,
        },
      }),
    ]);

  // Handle case where client row is missing from database indexes
  if (!customer) {
    throw new Error(
      `No customer matching ID ${id} exists in the ledger records.`,
    );
  }

  const totalInvoiced = historicalFinancialSummary._sum.grandTotal || 0;
  const totalPaid = historicalFinancialSummary._sum.amountPaid || 0;

  // Format response details securely so frontend field elements bind cleanly
  return {
    customer: {
      id: customer.id,
      name: customer.name,
      initialOpeningBalance: customer.initialOpeningBalance,
      openingBalanceDate: customer.openingBalanceDate
        ? customer.openingBalanceDate.toISOString().split("T")[0]
        : null,
      creditLimit: customer.creditLimit,
      outstandingBalance: customer.outstandingBalance,
      registrationDate: customer.createdAt.toISOString().split("T")[0],
    },
    meta: {
      totalTicketsCount,
      totalInvoiced,
      totalPaid,
      availableCredit: customer.creditLimit - customer.outstandingBalance,
    },
  };
};
