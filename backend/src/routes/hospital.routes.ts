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
 * Total Hospitals
 * GET /api/hospitals/count
 *
 * Registered BEFORE /:wallet — both are single-segment GET routes, so
 * "count" would otherwise be captured as a wallet param and never reach
 * this handler.
 */
router.get(
    "/count",
    controller.totalHospitals.bind(controller)
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
 * Get Hospital Details
 * GET /api/hospitals/:wallet
 */
router.get(
    "/:wallet",
    controller.getHospital.bind(controller)
);

/**
 * Verify Hospital
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

/**
 * Revoke Hospital Verification
 * POST /api/hospitals/revoke
 *
 * Body:
 * {
 *   "wallet":"0x..."
 * }
 */
router.post(
    "/revoke",
    controller.revokeVerification.bind(controller)
);

/**
 * Reactivate Hospital
 * POST /api/hospitals/reactivate
 *
 * Body:
 * {
 *   "wallet":"0x..."
 * }
 */
router.post(
    "/reactivate",
    controller.reactivateHospital.bind(controller)
);

/**
 * Deactivate Hospital (self — acts on backend signer's own wallet)
 * POST /api/hospitals/deactivate
 *
 * Body: (empty)
 */
router.post(
    "/deactivate",
    controller.deactivateHospital.bind(controller)
);

/**
 * Update Hospital Location (self — acts on backend signer's own wallet)
 * PUT /api/hospitals/location
 *
 * Body:
 * {
 *   "locationHash":"..."
 * }
 */
router.put(
    "/location",
    controller.updateLocation.bind(controller)
);

export default router;