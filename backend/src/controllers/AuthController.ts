import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";

export class AuthController {

	status(_req: Request, res: Response) {
		return sendSuccess(res, "Auth module available", {
			module: "auth",
			implemented: false
		});
	}
}
