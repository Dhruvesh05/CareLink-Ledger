import { NextFunction, Request, Response } from "express";

import { DownloadService } from "../ipfs/services/DownloadService";
import { PinService } from "../ipfs/services/PinService";
import { StorageService } from "../ipfs/services/StorageService";

type HttpError = Error & { status?: number };

type UploadRequestBody = {
	content?: unknown;
	fileName?: unknown;
	mimeType?: unknown;
	uploadedAt?: unknown;
};

type PinRequestBody = {
	cid?: unknown;
};

function createHttpError(status: number, message: string): HttpError {
	const error = new Error(message) as HttpError;
	error.status = status;
	return error;
}

function normalizeText(value: unknown, fieldName: string): string {
	if (typeof value !== "string") {
		throw createHttpError(400, `${fieldName} must be a string`);
	}

	const trimmedValue = value.trim();

	if (trimmedValue.length === 0) {
		throw createHttpError(400, `${fieldName} is required`);
	}

	return trimmedValue;
}

function normalizeCid(value: unknown): string {
	const cid = normalizeText(value, "cid");

	if (/\s/.test(cid)) {
		throw createHttpError(400, "cid must not contain whitespace");
	}

	return cid;
}

function normalizeUploadContent(value: unknown): string | Buffer | Uint8Array {
	if (typeof value === "string") {
		const trimmedValue = value.trim();

		if (trimmedValue.length === 0) {
			throw createHttpError(400, "content is required");
		}

		return trimmedValue;
	}

	if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
		if (value.length === 0) {
			throw createHttpError(400, "content is required");
		}

		return value;
	}

	throw createHttpError(400, "content must be a string or binary payload");
}

function normalizeUploadedAt(value: unknown): string | Date | undefined {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) {
			throw createHttpError(400, "uploadedAt must be a valid date");
		}

		return value;
	}

	if (typeof value === "string") {
		const trimmedValue = value.trim();

		if (trimmedValue.length === 0) {
			return undefined;
		}

		const parsedDate = new Date(trimmedValue);

		if (Number.isNaN(parsedDate.getTime())) {
			throw createHttpError(400, "uploadedAt must be a valid date");
		}

		return trimmedValue;
	}

	throw createHttpError(400, "uploadedAt must be a string or Date");
}

export class IPFSController {
	private readonly storageService: StorageService;
	private readonly downloadService: DownloadService;
	private readonly pinService: PinService;

	constructor(
		storageService: StorageService = new StorageService(),
		downloadService: DownloadService = new DownloadService(),
		pinService: PinService = new PinService()
	) {
		this.storageService = storageService;
		this.downloadService = downloadService;
		this.pinService = pinService;
	}

	async upload(
		req: Request<unknown, unknown, UploadRequestBody>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const content = normalizeUploadContent(req.body.content);
			const fileName = normalizeText(req.body.fileName, "fileName");
			const mimeType = normalizeText(req.body.mimeType, "mimeType");
			const uploadedAt = normalizeUploadedAt(req.body.uploadedAt);

			const storageResult = await this.storageService.store({
				content,
				fileName,
				mimeType,
				uploadedAt
			});

			res.status(201).json({
				success: true,
				message: "File uploaded successfully",
				data: storageResult
			});
		}
		catch (error) {
			next(error);
		}
	}

	async download(
		req: Request<{ cid: string }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const cid = normalizeCid(req.params.cid);
			const fileBuffer = await this.downloadService.downloadFile(cid);

			res.status(200);
			res.setHeader("Content-Type", "application/octet-stream");
			res.setHeader("Content-Disposition", `attachment; filename="${cid}"`);
			res.send(fileBuffer);
		}
		catch (error) {
			next(error);
		}
	}

	async pin(
		req: Request<unknown, unknown, PinRequestBody>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const cid = normalizeCid(req.body.cid);

			await this.pinService.pinCid(cid);

			res.status(200).json({
				success: true,
				message: "CID pinned successfully",
				cid
			});
		}
		catch (error) {
			next(error);
		}
	}

	async unpin(
		req: Request<{ cid: string }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const cid = normalizeCid(req.params.cid);

			await this.pinService.unpinCid(cid);

			res.status(200).json({
				success: true,
				message: "CID unpinned successfully",
				cid
			});
		}
		catch (error) {
			next(error);
		}
	}

	async pinStatus(
		req: Request<{ cid: string }>,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const cid = normalizeCid(req.params.cid);
			const pinned = await this.pinService.isPinned(cid);

			res.status(200).json({
				success: true,
				cid,
				pinned
			});
		}
		catch (error) {
			next(error);
		}
	}
}

export const ipfsController = new IPFSController();