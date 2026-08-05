/*
  Warnings:

  - Added the required column `durationLabel` to the `CredentialVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuer` to the `CredentialVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuingAuthority` to the `CredentialVerification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CredentialVerification" ADD COLUMN     "durationLabel" TEXT NOT NULL,
ADD COLUMN     "issuer" TEXT NOT NULL,
ADD COLUMN     "issuingAuthority" TEXT NOT NULL;
