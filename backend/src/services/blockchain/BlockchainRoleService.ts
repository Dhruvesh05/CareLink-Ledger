import { ethers } from "ethers";

import AccessControlABI from "../../blockchain/polygon/abi/AccessControl.json";
import { env } from "../../config/env";

export type BlockchainRole =
    | "Admin"
    | "Patient"
    | "Doctor"
    | "Hospital"
    | null;

export class BlockchainRoleService {

    private readonly provider: ethers.JsonRpcProvider;

    private readonly accessControl: ethers.Contract;

    constructor() {

        const blockchainProvider =
            process.env.BLOCKCHAIN_PROVIDER?.toLowerCase();

        let rpc: string | undefined;
        let accessControlAddress: string | undefined;

        switch (blockchainProvider) {

            case "polygon":
                rpc = env.POLYGON_RPC;
                accessControlAddress =
                    env.POLYGON_ACCESS_CONTROL_ADDRESS;
                break;

            case "ethereum":
                rpc = env.ETHEREUM_RPC;
                accessControlAddress =
                    env.ACCESS_CONTROL_ADDRESS;
                break;

            default:
                throw new Error(
                    `Unsupported blockchain provider for authentication: ${blockchainProvider}`
                );
        }

        if (!rpc) {
            throw new Error(
                "Blockchain RPC is not configured"
            );
        }

        if (!accessControlAddress) {
            throw new Error(
                "AccessControl contract address is not configured"
            );
        }

        this.provider =
            new ethers.JsonRpcProvider(rpc);

        this.accessControl =
            new ethers.Contract(
                accessControlAddress,
                AccessControlABI.abi,
                this.provider
            );
    }

    async getRole(
        walletAddress: string
    ): Promise<BlockchainRole> {

        if (!ethers.isAddress(walletAddress)) {
            throw new Error(
                "Invalid wallet address"
            );
        }

        const role =
            await this.accessControl.getRole(
                walletAddress
            );

        switch (Number(role)) {

            case 1:
                return "Patient";

            case 2:
                return "Doctor";

            case 3:
                return "Hospital";

            case 4:
                return "Admin";

            default:
                return null;
        }
    }
}
