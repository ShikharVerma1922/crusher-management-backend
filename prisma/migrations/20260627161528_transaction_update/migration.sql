/*
  Warnings:

  - You are about to drop the column `ratePerTon` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `grossWeight` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `tareWeight` on the `Transaction` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CREDIT');

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "ratePerTon";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "grossWeight",
DROP COLUMN "tareWeight",
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'CREDIT',
ADD COLUMN     "site" TEXT,
ALTER COLUMN "totalAmount" SET DEFAULT 0.00;
