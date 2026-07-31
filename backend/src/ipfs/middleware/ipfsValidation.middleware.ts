import { NextFunction, Request, RequestHandler, Response } from "express";

type HttpError = Error & { status?: number };

type UploadBody = {
	content?: unknown;
	fileName?: unknown;
	mimeType?: unknown;
	uploadedAt?: unknown;
};

type PinBody = {
	cid?: unknown;
};

type UploadFileLike = {
	mimetype?: string;
	size?: number;
	originalname?: string;
};

const DEFAULT_ALLOWED_MIME_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"text/plain",
	"application/json"
];

const MAX_UPLOAD_SIZE_BYTES = Number(process.env.IPFS_MAX_UPLOAD_SIZE_BYTES) || 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(
	(process.env.IPFS_ALLOWED_MIME_TYPES || DEFAULT_ALLOWED_MIME_TYPES.join(","))
		.split(",")
		.map((type) => type.trim())
		.filter((type) => type.length > 0)
);

function createHttpError(status: number, message: string): HttpError {
	const error = new Error(message) as HttpError;
	error.status = status;
	return error;
}

function isString(value: unknown): value is string {
	return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
	return isString(value) && value.trim().length > 0;
}

function parseCid(value: unknown): string {
	if (!isNonEmptyString(value)) {
		throw createHttpError(400, "cid is required");
	}

	const cid = value.trim();

	if (/\s/.test(cid)) {
		throw createHttpError(400, "cid must not contain whitespace");
	}

	if (!/^[A-Za-z0-9]+$/.test(cid)) {
		throw createHttpError(400, "cid format is invalid");
	}

	return cid;
}

function getUploadSourceSize(content: unknown, file?: UploadFileLike): number {
	if (typeof file?.size === "number") {
		return file.size;
	}

	if (Buffer.isBuffer(content)) {
		return content.length;
	}

	if (content instanceof Uint8Array) {
		return content.byteLength;
	}

	if (isString(content)) {
		return Buffer.byteLength(content, "utf8");
	}

	return 0;
}

function hasUploadContent(content: unknown, file?: UploadFileLike): boolean {
	if (typeof file?.size === "number") {
		return file.size > 0;
	}

	if (Buffer.isBuffer(content) || content instanceof Uint8Array) {
		return content.length > 0;
	}

	if (isString(content)) {
		return content.trim().length > 0;
	}

	return false;
}

function getUploadMimeType(body: UploadBody, file?: UploadFileLike): string | undefined {
	if (isNonEmptyString(file?.mimetype)) {
		return file.mimetype.trim();
	}

	if (isNonEmptyString(body.mimeType)) {
		return body.mimeType.trim();
	}

	return undefined;
}

function getUploadFileName(body: UploadBody, file?: UploadFileLike): string | undefined {
	if (isNonEmptyString(file?.originalname)) {
		return file.originalname.trim();
	}

	if (isNonEmptyString(body.fileName)) {
		return body.fileName.trim();
	}

	return undefined;
}

function extractUploadFile(req: Request): UploadFileLike | undefined {
	const file = (req as Request & { file?: UploadFileLike }).file;
	if (file && typeof file === "object") {
		return file;
	}

	return undefined;
}

function validateBodyFieldsMiddleware(requiredFields: Array<keyof UploadBody>): RequestHandler {
	return (req: Request, _res: Response, next: NextFunction) => {
		try {
			const body = req.body as UploadBody;

			for (const field of requiredFields) {
				if (!isNonEmptyString(body[field])) {
					throw createHttpError(400, `${String(field)} is required`);
				}
			}

			next();
		}
		catch (error) {
			next(error);
		}
	};
}

export const validateIpfsFileExistence: RequestHandler = (req, _res, next) => {
	try {
		const body = req.body as UploadBody;
		const file = extractUploadFile(req);

		if (!hasUploadContent(body.content, file)) {
			throw createHttpError(400, "file content is required");
		}

		next();
	}
	catch (error) {
		next(error);
	}
};

export const validateIpfsCidParam: RequestHandler = (req, _res, next) => {
	try {
		parseCid(req.params.cid);
		next();
	}
	catch (error) {
		next(error);
	}
};

export const validateIpfsPinBody: RequestHandler = (req, _res, next) => {
	try {
		const body = req.body as PinBody;
		parseCid(body.cid);
		next();
	}
	catch (error) {
		next(error);
	}
};

export const validateIpfsUploadContentSize: RequestHandler = (req, _res, next) => {
	try {
		const body = req.body as UploadBody;
		const size = getUploadSourceSize(body.content, extractUploadFile(req));

		if (size > MAX_UPLOAD_SIZE_BYTES) {
			throw createHttpError(413, `file exceeds maximum upload size of ${MAX_UPLOAD_SIZE_BYTES} bytes`);
		}

		next();
	}
	catch (error) {
		next(error);
	}
};

export const validateIpfsAllowedMimeType: RequestHandler = (req, _res, next) => {
	try {
		const body = req.body as UploadBody;
		const file = extractUploadFile(req);
		const mimeType = getUploadMimeType(body, file);

		if (!mimeType) {
			throw createHttpError(400, "mimeType is required");
		}

		if (!ALLOWED_MIME_TYPES.has(mimeType)) {
			throw createHttpError(415, `mimeType '${mimeType}' is not allowed`);
		}

		next();
	}
	catch (error) {
		next(error);
	}
};

export const validateIpfsRequestBodyFields = validateBodyFieldsMiddleware([
	"fileName",
	"mimeType"
]);

export const ipfsUploadValidationMiddleware = [
	validateIpfsRequestBodyFields,
	validateIpfsFileExistence,
	validateIpfsAllowedMimeType,
	validateIpfsUploadContentSize,
];

export const ipfsCidValidationMiddleware = [
	validateIpfsCidParam
];

export const ipfsPinValidationMiddleware = [
	validateIpfsPinBody
];
