-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "receiptNumber" DROP DEFAULT,
ALTER COLUMN "receiptNumber" SET DATA TYPE TEXT;
DROP SEQUENCE "Transaction_receiptNumber_seq";
