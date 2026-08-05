/*
  Warnings:

  - Added the required column `updatedAt` to the `CredentialVerification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CredentialVerification" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "project" DROP NOT NULL,
ALTER COLUMN "stipendStatus" DROP NOT NULL;
