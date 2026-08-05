import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as certificateService from "../services/certificate.service.js";
import { ApiError } from "../utils/ApiError.js";

export const handleGetCertificateById = asyncHandler(async (req, res) => {
  const certificate = await certificateService.getCertificateById(
    req.params.id,
  );

  if (!certificate) {
    throw new ApiError(404, "Certificate record not found or invalid.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, certificate, "Certificate fetched successfully"),
    );
});

export const handleCreateCertificate = asyncHandler(async (req, res) => {
  const newCert = await certificateService.createCertificate(req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, newCert, "Certificate created successfully."));
});
