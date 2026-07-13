/*
  Warnings:

  - You are about to drop the column `customerName` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentType` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `rateApplied` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `site` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RateStatus" AS ENUM ('SETTLED', 'OPEN');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "customerName",
DROP COLUMN "paymentType",
DROP COLUMN "quantity",
DROP COLUMN "rateApplied",
DROP COLUMN "site",
DROP COLUMN "totalAmount",
ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "materialAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "materialQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "materialRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentMode" "PaymentType" NOT NULL DEFAULT 'CREDIT',
ADD COLUMN     "rateStatus" "RateStatus" NOT NULL DEFAULT 'SETTLED',
ADD COLUMN     "royaltyAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "royaltyQuantity" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "royaltyRate" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "site" TEXT,
    "outstandingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "referenceNo" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "receivedById" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
