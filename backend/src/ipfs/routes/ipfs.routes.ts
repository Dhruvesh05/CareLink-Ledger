import {
	Router
} from "express";

import {
	IPFSController
} from "../../controllers/IPFSController";

import {
	ipfsCidValidationMiddleware,
	ipfsPinValidationMiddleware,
	ipfsUploadValidationMiddleware
} from "../middleware/ipfsValidation.middleware";

const router = Router();

const controller =
	new IPFSController();

/*
==========================================================
UPLOAD
POST /api/ipfs/upload
==========================================================

Body:

{
	"content": "hello",
	"fileName": "test.txt",
	"mimeType": "text/plain",
	"pin": true
}

For medical records, use MedicalRecordService instead.
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
POST /api/ipfs/pin
==========================================================
*/

router.post(
	"/pin",
	...ipfsPinValidationMiddleware,
	controller.pin.bind(controller)
);

/*
==========================================================
UNPIN
DELETE /api/ipfs/pin/:cid
==========================================================
*/

router.delete(
	"/pin/:cid",
	...ipfsCidValidationMiddleware,
	controller.unpin.bind(controller)
);

/*
==========================================================
PIN STATUS
GET /api/ipfs/pin/:cid
==========================================================
*/

router.get(
	"/pin/:cid",
	...ipfsCidValidationMiddleware,
	controller.pinStatus.bind(controller)
);

export default router;