import e from "express";
import {
  handleCreateCertificate,
  handleGetCertificateById,
} from "../controllers/certificate.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = e.Router();

router.get("/:id", handleGetCertificateById);

router.post("/", protect, authorize("OWNER"), handleCreateCertificate);

export default router;
