import { Request, Response } from "express";
import { getDatabaseHealth } from "../config/database";
import { sendError, sendSuccess } from "../utils/response";

function isConfigured(value: string | undefined): boolean {
	return Boolean(value && value.trim().length > 0);
}

export class HealthController {

	liveness(_req: Request, res: Response) {
		return sendSuccess(
			res,
			"Service is alive",
			{
				service: "carelink-backend",
				timestamp: new Date().toISOString()
			}
		);
	}

	readiness(_req: Request, res: Response) {
		const database = getDatabaseHealth();

		const deps = {
			database,
			blockchain: {
				provider: process.env.BLOCKCHAIN_PROVIDER || "ethereum",
				ethereumRpcConfigured: isConfigured(process.env.ETHEREUM_RPC)
			},
			ipfs: {
				host: process.env.IPFS_HOST || "127.0.0.1",
				port: Number(process.env.IPFS_PORT || 5001)
			}
		};

		const ready = database.status === "connected" || database.status === "connecting";

		if (!ready) {
			return sendError(
				res,
				"Service is not ready",
				503,
				deps as any
			);
		}

		return sendSuccess(
			res,
			"Service is ready",
			deps
		);
	}
}
