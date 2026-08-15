import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/response";

interface HttpError extends Error {
	status?: number;
	code?: string;
}

export function errorHandler(
	err: HttpError,
	_req: Request,
	res: Response,
	_next: NextFunction
) {
	const statusCode = err.status && Number.isInteger(err.status)
		? err.status
		: 500;

	const isProd = process.env.NODE_ENV === "production";

	return sendError(
		res,
		statusCode >= 500 && isProd
			? "Internal Server Error"
			: (err.message || "Internal Server Error"),
		statusCode,
		{
			...(err.code ? { code: err.code } : {}),
			...(isProd ? {} : { stack: err.stack || null })
		}
	);
}
