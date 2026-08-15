import { Response } from "express";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

export interface ApiSuccess<T = unknown> {
	success: true;
	message: string;
	data?: T;
}

export interface ApiFailure {
	success: false;
	message: string;
	error?: JsonObject;
}

export function sendSuccess<T>(
	res: Response,
	message: string,
	data?: T,
	statusCode = 200
) {
	const payload: ApiSuccess<T> = {
		success: true,
		message,
		...(data !== undefined ? { data } : {})
	};

	return res.status(statusCode).json(payload);
}

export function sendError(
	res: Response,
	message: string,
	statusCode = 500,
	error?: JsonObject
) {
	const payload: ApiFailure = {
		success: false,
		message,
		...(error ? { error } : {})
	};

	return res.status(statusCode).json(payload);
}
