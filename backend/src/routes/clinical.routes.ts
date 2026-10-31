import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { ClinicalController } from "../controllers/ClinicalController";

const router = Router();
router.use(authenticate);
const controller = new ClinicalController();

router.get("/patients", requireRole("Doctor"), controller.listPatients.bind(controller));
router.get("/access-requests/patients", requireRole("Doctor"), controller.searchEligiblePatients.bind(controller));
router.post("/access-requests", requireRole("Doctor"), controller.createAccessRequest.bind(controller));
router.get("/access-requests", requireRole("Doctor", "Patient"), controller.listAccessRequests.bind(controller));
router.post("/access-requests/:requestId/approve/prepare", requireRole("Patient"), controller.prepareAccessApproval.bind(controller));
router.post("/access-requests/:requestId/approve/confirm", requireRole("Patient"), controller.confirmAccessApproval.bind(controller));
router.post("/access-requests/:requestId/reject", requireRole("Patient"), controller.rejectAccessRequest.bind(controller));
router.post("/access-requests/:requestId/revoke/prepare", requireRole("Patient"), controller.prepareAccessRevocation.bind(controller));
router.post("/access-requests/:requestId/revoke/confirm", requireRole("Patient"), controller.confirmAccessRevocation.bind(controller));
router.get("/notes", requireRole("Doctor", "Patient"), controller.listNotes.bind(controller));
router.post("/notes", requireRole("Doctor"), controller.createNote.bind(controller));
router.get("/notifications", controller.notifications.bind(controller));
router.patch("/notifications/:notificationId/read", controller.markNotificationRead.bind(controller));

export default router;
