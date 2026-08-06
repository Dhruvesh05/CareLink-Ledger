import { Router } from "express";

import { IPFSController } from "../../controllers/IPFSController";
import {
	ipfsCidValidationMiddleware,
	ipfsPinValidationMiddleware,
	ipfsUploadValidationMiddleware
} from "../middleware/ipfsValidation.middleware";

const router = Router();
const controller = new IPFSController();

/*
==========================================================
UPLOAD
POST /api/ipfs/upload
==========================================================
*/
router.post(
	"/upload",
	...ipfsUploadValidationMiddleware,
	controller.upload.bind(controller)
);

/*
==========================================================
DOWNLOAD
GET /api/ipfs/download/:cid
==========================================================
*/
router.get(
	"/download/:cid",
	...ipfsCidValidationMiddleware,
	controller.download.bind(controller)
);

/*
==========================================================
PIN
==========================================================
*/
router.post(
	"/pin",
	...ipfsPinValidationMiddleware,
	controller.pin.bind(controller)
);

router.delete(
	"/pin/:cid",
	...ipfsCidValidationMiddleware,
	controller.unpin.bind(controller)
);

router.get(
	"/pin/:cid",
	...ipfsCidValidationMiddleware,
	controller.pinStatus.bind(controller)
);

export default router;