import { NextFunction, Request, Response } from "express";
import type { W3CVerifiablePresentation } from "@veramo/core-types";
import type { UserRole } from "../../models/User";
import { sendError } from "../../utils/response";
import PresentationService from "../services/PresentationService";
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
            req.body?.verifiablePresentation ??
            req.headers?.["x-carelink-presentation"];

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

        const challengeId =
            req.method === "GET"
                ? req.headers["x-carelink-challenge-id"]
                : req.body?.challengeId;

        let pendingChallenge;
        try {
            if (typeof challengeId !== "string" || !challengeId.trim()) {
                return sendError(res, "SSI authorization challenge is required", 403);
            }
            const exactChallenge =
                await SsiAuthorizationChallengeService.getChallenge(
                    req.auth.userId,
                    challengeId
                );
            if (!exactChallenge) {
                return sendError(res, "SSI authorization failed", 403);
            }
            pendingChallenge = exactChallenge;
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
        } catch (error) {
            console.error(
                "[ssi-auth] Presentation verifier threw:",
                error instanceof Error ? error.message : "Unknown verifier error",
            );

            return sendError(
                res,
                "Verifiable presentation is invalid",
                403,
            );
        }

        if (!verification?.verified) {
            const details = verification as PresentationVerification & {
                error?: {
                    message?: unknown;
                    errorCode?: unknown;
                };
            };

            const vp = presentation as Record<string, unknown>;
            const proof =
                vp.proof && typeof vp.proof === "object"
                    ? vp.proof as Record<string, unknown>
                    : undefined;
            const credentials = Array.isArray(vp.verifiableCredential)
                ? vp.verifiableCredential
                : [];

            console.warn("[ssi-auth] Presentation verification rejected:", {
                errorCode:
                    typeof details.error?.errorCode === "string"
                        ? details.error.errorCode
                        : "not provided",
                errorMessage:
                    typeof details.error?.message === "string"
                        ? details.error.message
                        : "No verifier message provided",
                presentationType: typeof presentation,
                hasHolder: typeof vp.holder === "string",
                proofType: proof?.type ?? "missing",
                credentialCount: credentials.length,
                credentialProofPresent: credentials.map(
                    (credential) =>
                        Boolean(
                            credential &&
                            typeof credential === "object" &&
                            "proof" in credential &&
                            (credential as Record<string, unknown>).proof,
                        ),
                ),
                challengeAvailable: Boolean(pendingChallenge.challenge),
            });

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
                pendingChallenge.challengeId,
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