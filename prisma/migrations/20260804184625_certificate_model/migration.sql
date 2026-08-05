-- CreateTable
CREATE TABLE "CredentialVerification" (
    "id" TEXT NOT NULL,
    "certId" TEXT NOT NULL,
    "internName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "stipendStatus" TEXT NOT NULL,
    "technologies" TEXT[],
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CredentialVerification_certId_key" ON "CredentialVerification"("certId");
