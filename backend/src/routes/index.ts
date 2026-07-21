import { Router } from "express";

import patientRoutes from "./patient.routes";
import doctorRoutes from "./doctor.routes";
import hospitalRoutes from "./hospital.routes";
import medicalRecordRoutes from "./medicalRecord.routes";

const router = Router();

router.use("/patients", patientRoutes);

router.use("/doctors", doctorRoutes);

router.use("/hospitals", hospitalRoutes);

router.use("/records", medicalRecordRoutes);

export default router;