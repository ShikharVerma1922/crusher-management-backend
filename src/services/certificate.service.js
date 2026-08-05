import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Generate a sequential Certificate ID for new entries
 * Format: ME-INT-2026-001
 */
const generateCertificateId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `ME-INT-${currentYear}-`;

  // Find the last issued certificate for the current year
  const lastCert = await prisma.credentialVerification.findFirst({
    where: {
      certId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      certId: true,
    },
  });

  if (!lastCert) {
    return `${prefix}001`;
  }

  // Extract sequence number and increment
  const lastSequence = parseInt(lastCert.certId.replace(prefix, ""), 10);
  const nextSequence = String(lastSequence + 1).padStart(3, "0");

  return `${prefix}${nextSequence}`;
};

/**
 * Service to fetch a certificate record by ID for the verification portal
 */
export const getCertificateById = async (certId) => {
  const normalizedId = certId.trim().toUpperCase();

  const certificate = await prisma.credentialVerification.findUnique({
    where: {
      certId: normalizedId,
    },
  });

  if (!certificate || !certificate.isValid) {
    return null; // Triggers "Record Not Found" state in React frontend
  }

  return certificate;
};

/**
 * Service to issue and store a new certificate record in PostgreSQL
 */
export const createCertificate = async (certificateData) => {
  const certId = await generateCertificateId();

  const newCertificate = await prisma.credentialVerification.create({
    data: {
      certId,
      internName: certificateData.internName,
      role: certificateData.role,
      project: certificateData.project,
      duration: certificateData.duration,
      durationLabel: certificateData.durationLabel,
      issueDate: new Date(certificateData.issueDate),
      issuer: certificateData.issuer || "Mandar Enterprises",
      issuingAuthority: certificateData.issuingAuthority,
      stipendStatus: certificateData.stipendStatus || "Unpaid",
      technologies: certificateData.technologies || [],
      isValid: true,
    },
  });

  return newCertificate;
};
