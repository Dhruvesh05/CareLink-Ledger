import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { OperationsController } from "../controllers/OperationsController";

const router = Router();
router.use(authenticate);
const controller = new OperationsController();

router.get("/appointments", controller.listAppointments.bind(controller));
router.post("/appointments", requireRole("Patient", "Doctor"), controller.createAppointment.bind(controller));
router.patch("/appointments/:appointmentId", controller.updateAppointment.bind(controller));
router.get("/invoices", requireRole("Patient", "Hospital", "Admin"), controller.listInvoices.bind(controller));
router.get("/invoices/:invoiceId", requireRole("Patient", "Hospital", "Admin"), controller.getInvoice.bind(controller));
router.post("/invoices", requireRole("Hospital"), controller.createInvoice.bind(controller));
router.patch("/invoices/:invoiceId", requireRole("Hospital"), controller.updateInvoice.bind(controller));

export default router;
