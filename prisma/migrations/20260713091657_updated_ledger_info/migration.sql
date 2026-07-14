/*
  Warnings:

  - You are about to drop the column `companyName` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `site` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "companyName",
DROP COLUMN "site";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "site" TEXT;
