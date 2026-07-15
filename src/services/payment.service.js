import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export const createPaymentRecord = async ({
  customerId,
  amountPaid,
  paymentMode,
  referenceNo,
  remarks,
}) => {
  // 1. Validation
  if (
    !customerId ||
    !amountPaid ||
    isNaN(amountPaid) ||
    parseFloat(amountPaid) <= 0
  ) {
    throw new ApiError(400, "Invalid payment payload parameters.");
  }

  const paymentVal = parseFloat(amountPaid);

  // 2. Execute atomic ledger transaction update
  const result = await prisma.$transaction(async (tx) => {
    // A. Verify customer exists
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new Error("Customer record not found.");
    }

    // B. Generate unique receipt voucher token (e.g., REC-10004)
    const paymentCount = await tx.payment.count();
    const receiptNumber = `PAY-${10001 + paymentCount}`;

    // C. Record payment voucher to ledger DB
    const newPayment = await tx.payment.create({
      data: {
        customerId,
        receiptNumber,
        amountPaid: paymentVal,
        paymentMode,
        referenceNo: referenceNo || null,
        remarks: remarks || null,
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

    return { newPayment, updatedCustomer };
  });

  return {
    receiptNumber: result.newPayment.receiptNumber,
    newBalance: result.updatedCustomer.outstandingBalance,
  };
};
