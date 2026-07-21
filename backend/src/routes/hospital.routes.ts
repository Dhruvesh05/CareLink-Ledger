import { Router } from "express";
import { HospitalController } from "../controllers/HospitalController";

const router = Router();
const controller = new HospitalController();

/**
 * Register Hospital
 * POST /api/hospitals/register
 */
router.post(
    "/register",
    controller.registerHospital.bind(controller)
);

/**
 * Get Hospital Details
 * GET /api/hospitals/:wallet
 */
router.get(
    "/:wallet",
    controller.getHospital.bind(controller)
);

/**
 * Check Hospital Active Status
 * GET /api/hospitals/active/:wallet
 */
router.get(
    "/active/:wallet",
    controller.isHospitalActive.bind(controller)
);

/**
 * Check Hospital Verification Status (REST)
 * GET /api/hospitals/verified/:wallet
 */
router.get(
    "/verified/:wallet",
    controller.isHospitalVerified.bind(controller)
);

/**
 * Check Hospital Verification Status (POST)
 * POST /api/hospitals/verify
 *
 * Body:
 * {
 *   "wallet":"0x..."
 * }
 */
router.post(
    "/verify",
    controller.verifyHospital.bind(controller)
);

export default router;