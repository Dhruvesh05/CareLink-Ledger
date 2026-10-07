import { Request, Response } from "express";

import {
    UserDidError,
    UserDidService
} from "../services/UserDidService";
import SsiAuthorizationChallengeService from "../services/SsiAuthorizationChallengeService";
import { sendError, sendSuccess } from "../utils/response";

export class IdentityController {
    private readonly userDidService = new UserDidService();

    private readonly ssiAuthorizationChallengeService =
        SsiAuthorizationChallengeService;

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

    async authorizationChallenge(req: Request, res: Response) {
        if (!req.auth?.userId) {
            return sendError(
                res,
                "Authentication required",
                401
            );
        }

        try {
            const challenge =
                await this.ssiAuthorizationChallengeService.createChallenge(
                    req.auth.userId
                );

            return sendSuccess(
                res,
                "SSI authorization challenge created",
                challenge
            );
        } catch {
            return sendError(
                res,
                "Unable to create SSI authorization challenge",
                500
            );
        }
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