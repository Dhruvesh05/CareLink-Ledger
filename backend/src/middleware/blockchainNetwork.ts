import type { NextFunction, Request, Response } from "express";
import { getSupportedEvmNetwork, type SupportedEvmNetwork } from "../blockchain/config/supportedNetworks";

declare global {
    namespace Express {
        interface Request {
            careLinkNetwork?: SupportedEvmNetwork;
        }
    }
}

/**
 * Resolves the UI-selected testnet for this request only. No process-wide
 * environment variables are changed, so concurrent Sepolia/Amoy requests do
 * not influence each other. Requests without the header keep legacy behavior.
 */
export function resolveBlockchainNetwork(req: Request, res: Response, next: NextFunction) {
    const header = req.get("X-CareLink-Chain-Id");
    if (!header) {
        return next();
    }

    if (!/^\d+$/.test(header.trim())) {
        return res.status(400).json({ success: false, message: "X-CareLink-Chain-Id must be a supported numeric chain ID." });
    }

    try {
        req.careLinkNetwork = getSupportedEvmNetwork(Number(header));
        return next();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Selected blockchain network is not configured.";
        const status = message.startsWith("Unsupported blockchain chain ID") ? 400 : 503;
        return res.status(status).json({ success: false, message });
    }
}
