import { Router } from "express";

import patientRoutes from "./patient.routes";
import doctorRoutes from "./doctor.routes";
import hospitalRoutes from "./hospital.routes";
import medicalRecordRoutes from "./medicalRecord.routes";
import auditRoutes from "./audit.routes";

const router = Router();

router.use("/patients", patientRoutes);
router.use("/doctors", doctorRoutes);
router.use("/hospitals", hospitalRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/audit", auditRoutes);

export default router;