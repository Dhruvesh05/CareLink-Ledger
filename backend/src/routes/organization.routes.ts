import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { OrganizationController } from "../controllers/OrganizationController";

const router = Router();
router.use(authenticate, requireRole("Hospital"));
const controller = new OrganizationController();

router.get("/departments", controller.listDepartments.bind(controller));
router.post("/departments", controller.createDepartment.bind(controller));
router.patch("/departments/:departmentId", controller.updateDepartment.bind(controller));
router.get("/associations", controller.listAssociations.bind(controller));
router.get("/doctors", controller.doctorDirectory.bind(controller));
router.post("/associations", controller.createAssociation.bind(controller));
router.patch("/associations/:associationId", controller.updateAssociation.bind(controller));
router.patch("/associations/:associationId/revoke", controller.revokeAssociation.bind(controller));
router.get("/patients", controller.patients.bind(controller));
router.get("/stats", controller.stats.bind(controller));
router.get("/activities", controller.activities.bind(controller));

export default router;
