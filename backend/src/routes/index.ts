import { Router } from "express";

import patientRoutes from "./patient.routes";
import doctorRoutes from "./doctor.routes";
import hospitalRoutes from "./hospital.routes";
import medicalRecordRoutes from "./medicalRecord.routes";
import auditRoutes from "./audit.routes";
import authRoutes from "./auth.routes";
import profileRoutes from "./profile.routes";
import healthRoutes from "./health.routes";
import ipfsRoutes from "../ipfs/routes/ipfs.routes";
import identityRoutes from "./identity.routes";
import analyticsRoutes from "./analytics.routes";
import fabricMedicalRecordRoutes from "./fabricMedicalRecord.routes";
import { resolveBlockchainNetwork } from "../middleware/blockchainNetwork";
import organizationRoutes from "./organization.routes";
import adminRoutes from "./admin.routes";
import operationsRoutes from "./operations.routes";
import clinicalRoutes from "./clinical.routes";

const router = Router();

// A UI-selected network is request-scoped and only affects routes/services
// that explicitly use req.careLinkNetwork. Missing headers preserve legacy
// behavior for CLI tools, integration scripts and older clients.
router.use(resolveBlockchainNetwork);

router.use("/patients", patientRoutes);
router.use("/doctors", doctorRoutes);
router.use("/hospitals", hospitalRoutes);
router.use("/fabric/medical-records", fabricMedicalRecordRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/audit", auditRoutes);
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/health", healthRoutes);
router.use("/ipfs", ipfsRoutes);
router.use("/identity", identityRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/organization", organizationRoutes);
router.use("/admin", adminRoutes);
router.use("/operations", operationsRoutes);
router.use("/clinical", clinicalRoutes);

export default router;