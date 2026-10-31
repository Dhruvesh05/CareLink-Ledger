import { ethers } from "ethers";

import AccessControlABI from "../../blockchain/polygon/abi/AccessControl.json";
import EthereumAccessControlABI from "../../blockchain/ethereum/abi/AccessControl.json";
import { env } from "../../config/env";
import { getSupportedEvmNetwork } from "../../blockchain/config/supportedNetworks";

export type BlockchainRole =
    | "Admin"
    | "Patient"
    | "Doctor"
    | "Hospital"
    | null;

export class BlockchainRoleService {

    private readonly provider: ethers.JsonRpcProvider;

    private readonly accessControl: ethers.Contract;

    constructor(chainId?: number) {

        if (chainId !== undefined) {
            const network = getSupportedEvmNetwork(chainId);
            const accessControlAddress = network.accessControlAddress;
            if (!accessControlAddress) {
                throw new Error(`AccessControl address is not configured for ${network.name}`);
            }
            this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
            this.accessControl = new ethers.Contract(
                accessControlAddress,
                network.provider === "polygon" ? AccessControlABI.abi : EthereumAccessControlABI.abi,
                this.provider
            );
            return;
        }

        const blockchainProvider =
            process.env.BLOCKCHAIN_PROVIDER?.toLowerCase();

        let rpc: string | undefined;
        let accessControlAddress: string | undefined;
        let accessControlAbi: typeof AccessControlABI.abi = AccessControlABI.abi;

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
                accessControlAbi = EthereumAccessControlABI.abi;
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
                accessControlAbi,
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
