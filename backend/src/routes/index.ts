import { Router } from "express";

import patientRoutes from "./patient.routes";
import doctorRoutes from "./doctor.routes";
import hospitalRoutes from "./hospital.routes";
import medicalRecordRoutes from "./medicalRecord.routes";
import auditRoutes from "./audit.routes";
import authRoutes from "./auth.routes";
import healthRoutes from "./health.routes";
import ipfsRoutes from "../ipfs/routes/ipfs.routes";

const router = Router();

router.use("/patients", patientRoutes);
router.use("/doctors", doctorRoutes);
router.use("/hospitals", hospitalRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/audit", auditRoutes);
router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/ipfs", ipfsRoutes);

export default router;