/*
  Warnings:

  - You are about to drop the column `netWeight` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "netWeight",
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0;
