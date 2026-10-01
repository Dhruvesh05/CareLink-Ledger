import { Request, Response } from "express";

import {
    UserDidError,
    UserDidService
} from "../services/UserDidService";
import { sendError, sendSuccess } from "../utils/response";

export class IdentityController {
    private readonly userDidService = new UserDidService();

    async createOrLoadDid(req: Request, res: Response) {
        return this.respondWithDid(
            req,
            res,
            () => this.userDidService.createOrLoadDid(req.auth!.userId),
            "CareLink DID created or loaded"
        );
    }

    async getDid(req: Request, res: Response) {
        return this.respondWithDid(
            req,
            res,
            () => this.userDidService.getDid(req.auth!.userId),
            "CareLink DID retrieved"
        );
    }

    private async respondWithDid(
        req: Request,
        res: Response,
        loadDid: () => Promise<string>,
        message: string
    ) {
        if (!req.auth?.userId) {
            return sendError(
                res,
                "Authentication required",
                401
            );
        }

        try {
            const did = await loadDid();
            return sendSuccess(res, message, { did });
        } catch (error) {
            const status = error instanceof UserDidError
                ? error.status
                : 500;
            const message = error instanceof Error
                ? error.message
                : "Failed to retrieve CareLink DID";

            return sendError(res, message, status);
        }
    }
}

export default IdentityController;