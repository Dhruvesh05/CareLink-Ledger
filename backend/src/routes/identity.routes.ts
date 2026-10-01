import { Router } from "express";

import { authenticate } from "../middleware/auth";
import IdentityController from "../controllers/IdentityController";

const router = Router();
const controller = new IdentityController();

router.use(authenticate);

router.post(
    "/did",
    controller.createOrLoadDid.bind(controller)
);

router.get(
    "/did",
    controller.getDid.bind(controller)
);

router.post(
    "/authorization-challenge",
    controller.authorizationChallenge.bind(controller)
);

export default router;