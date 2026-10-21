import { NextFunction, Request, Response } from "express";
import type { W3CVerifiablePresentation } from "@veramo/core-types";
import type { UserRole } from "../../models/User";
import { sendError } from "../../utils/response";
import { PresentationService } from "../services/PresentationService";
import { CareLinkAuthorizationService } from "../services/CareLinkAuthorizationService";
import SsiAuthorizationChallengeService from "../../services/SsiAuthorizationChallengeService";

declare global {
    namespace Express {
        interface Request {
            careLinkAuth?: {
                userId: string;
                did: string;
                role: UserRole;
            };
        }
    }
}

type PresentationVerification = {
    verified: boolean;
    [key: string]: unknown;
};

const careLinkAuthorizationService = new CareLinkAuthorizationService();

export function requireCareLinkRole(...requiredRoles: UserRole[]) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        if (!req.auth?.userId) {
            return sendError(res, "SSI authorization failed", 403);
        }

        const rawPresentation =
            req.body?.presentation ??
            req.body?.verifiablePresentation;

        let presentation: unknown = rawPresentation;

        if (typeof rawPresentation === "string") {
            try {
                presentation = JSON.parse(rawPresentation);
            } catch {
                return sendError(
                    res,
                    "Verifiable presentation is invalid",
                    403,
                );
            }
        }

        if (
            !presentation ||
            typeof presentation !== "object" ||
            Array.isArray(presentation)
        ) {
            return sendError(
                res,
                "Verifiable presentation is required",
                403,
            );
        }

        let pendingChallenge;

        try {
            pendingChallenge =
                await SsiAuthorizationChallengeService.getPendingChallenge(
                    req.auth.userId,
                );
        } catch {
            return sendError(
                res,
                "SSI authorization failed",
                403,
            );
        }

        if (!pendingChallenge) {
            return sendError(
                res,
                "SSI authorization failed",
                403,
            );
        }

        let verification: PresentationVerification;

        try {
            verification = await (
                PresentationService as unknown as {
                    verifyPresentation: (
                        presentation: W3CVerifiablePresentation,
                        challenge: string,
                    ) => Promise<PresentationVerification>;
                }
            ).verifyPresentation(
                presentation as W3CVerifiablePresentation,
                pendingChallenge.challenge,
            );
        } catch {
            return sendError(
                res,
                "Verifiable presentation is invalid",
                403,
            );
        }

        if (!verification?.verified) {
            return sendError(
                res,
                "Verifiable presentation is invalid",
                403,
            );
        }

        let identity;

        try {
            identity =
                await careLinkAuthorizationService.authorizeVerifiedPresentation({
                    presentation: presentation as W3CVerifiablePresentation,
                    verification,
                });
        } catch {
            return sendError(
                res,
                "SSI authorization failed",
                403,
            );
        }

        if (identity.userId !== req.auth.userId) {
            return sendError(
                res,
                "SSI authorization failed",
                403,
            );
        }

        if (
            requiredRoles.length > 0 &&
            !requiredRoles.includes(identity.role)
        ) {
            return sendError(
                res,
                "Insufficient CareLink role",
                403,
            );
        }

        let consumed: boolean;

        try {
            consumed =
                await SsiAuthorizationChallengeService.consumeChallenge(
                    req.auth.userId,
                    pendingChallenge.challenge,
                );
        } catch {
            return sendError(
                res,
                "SSI authorization failed",
                403,
            );
        }

        if (!consumed) {
            return sendError(
                res,
                "SSI authorization failed",
                403,
            );
        }

        req.careLinkAuth = identity;
        return next();
    };
}