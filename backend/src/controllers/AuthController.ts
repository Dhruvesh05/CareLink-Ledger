import { Request, Response } from "express";

import { AuthService } from "../services/AuthService";
import { sendError, sendSuccess } from "../utils/response";

export class AuthController {
    private readonly authService = new AuthService();

    status(_req: Request, res: Response) {
        return sendSuccess(res, "Auth module available", {
            module: "auth",
            implemented: true
        });
    }

    async challenge(
        req: Request,
        res: Response
    ) {
        try {
            const { walletAddress } = req.body;

            if (
                typeof walletAddress !== "string" ||
                !walletAddress.trim()
            ) {
                return sendError(
                    res,
                    "walletAddress is required",
                    400
                );
            }

            const challenge =
                await this.authService.createChallenge(
                    walletAddress
                );

            return sendSuccess(
                res,
                "Authentication challenge created",
                challenge
            );
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to create authentication challenge";

            return sendError(
                res,
                message,
                400
            );
        }
    }

    async verify(
        req: Request,
        res: Response
    ) {
        try {
            const {
                walletAddress,
                message,
                signature
            } = req.body;

            if (
                typeof walletAddress !== "string" ||
                !walletAddress.trim()
            ) {
                return sendError(
                    res,
                    "walletAddress is required",
                    400
                );
            }

            if (
                typeof message !== "string" ||
                !message.trim()
            ) {
                return sendError(
                    res,
                    "message is required",
                    400
                );
            }

            if (
                typeof signature !== "string" ||
                !signature.trim()
            ) {
                return sendError(
                    res,
                    "signature is required",
                    400
                );
            }

            const result =
                await this.authService.verifyWalletSignature({
                    walletAddress,
                    message,
                    signature
                });

            return sendSuccess(
                res,
                "Wallet authenticated successfully",
                result
            );
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Wallet authentication failed";

            return sendError(
                res,
                message,
                400
            );
        }
    }
}
