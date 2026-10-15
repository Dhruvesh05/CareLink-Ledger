import { Request, Response } from "express";

import {
    UserDidError,
    UserDidService
} from "../services/UserDidService";
import SsiAuthorizationChallengeService from "../services/SsiAuthorizationChallengeService";
import { sendError, sendSuccess } from "../utils/response";
import PresentationService from "../ssi/services/PresentationService";
import CareLinkCredentialService from "../ssi/services/CareLinkCredentialService";
import CredentialPersistenceService from "../ssi/services/CredentialPersistenceService";
import { env } from "../config/env";
import UserModel from "../models/User";

export class IdentityController {
    private readonly userDidService = new UserDidService();

    private readonly ssiAuthorizationChallengeService =
        SsiAuthorizationChallengeService;

    async createAuthorizationPresentation(req: Request, res: Response) {
        if (!req.auth?.userId) {
            return sendError(res, "Authentication required", 401);
        }

        try {
            const subjectDid =
                await this.userDidService.getDid(req.auth.userId);
            const challenge =
                await this.ssiAuthorizationChallengeService
                    .getPendingChallenge(req.auth.userId);

            if (!challenge) {
                return sendError(
                    res,
                    "SSI authorization challenge is required",
                    403
                );
            }

            const credential =
                await this.getRoleCredential(
                    req.auth.userId,
                    subjectDid
                );

            const presentation =
                await PresentationService.createPresentation(
                    subjectDid,
                    [credential as any],
                    challenge.challenge
                );

            return sendSuccess(
                res,
                "SSI authorization presentation created",
                { presentation }
            );
        } catch (error) {
            console.error(
                "Failed to create SSI authorization presentation",
                error
            );
            return sendError(
                res,
                "Unable to create SSI authorization proof",
                500
            );
        }
    }

    async authorization(req: Request, res: Response) {
        return sendSuccess(
            res,
            "SSI authorization verified",
            { authorized: true }
        );
    }

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

    private async getRoleCredential(
        userId: string,
        subjectDid: string
    ): Promise<Record<string, unknown>> {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error("Authenticated application user not found");
        }

        const persisted =
            await CredentialPersistenceService
                .getCredentialsBySubject(subjectDid);

        const matching =
            persisted.find((credential) =>
                Array.isArray(credential.type) &&
                credential.type.includes("CareLinkRoleCredential") &&
                credential.issuer === env.CARELINK_ISSUER_DID &&
                credential.credentialSubject?.id === subjectDid &&
                credential.credentialSubject?.role === user.role
            );

        if (matching) {
            return matching;
        }

        if (!env.CARELINK_ISSUER_DID) {
            throw new Error("CareLink issuer is not configured");
        }

        return CareLinkCredentialService.issueRoleCredential({
            userId,
            subjectDid,
            issuerDid: env.CARELINK_ISSUER_DID
        });
    }
}

export default IdentityController;