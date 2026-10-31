import { env } from "../../config/env";

export type EvmProviderName = "ethereum" | "polygon";

export interface SupportedEvmNetwork {
    chainId: 11155111 | 80002;
    provider: EvmProviderName;
    network: "sepolia" | "amoy";
    name: "Ethereum Sepolia" | "Polygon Amoy";
    rpcUrl: string;
    explorerUrl: string;
    nativeCurrency: { name: "Sepolia Ether" | "POL"; symbol: "SepoliaETH" | "POL"; decimals: 18 };
    medicalRecordAddress: string;
    accessControlAddress: string | undefined;
}

function requireConfigured(value: string | undefined, field: string, networkName: string): string {
    const normalized = value?.trim();
    if (!normalized) {
        throw new Error(`${field} is not configured for ${networkName}`);
    }
    return normalized;
}

export function getSupportedEvmNetwork(chainId: number): SupportedEvmNetwork {
    if (chainId === 11155111) {
        if (env.ETHEREUM_NETWORK.toLowerCase() !== "sepolia") {
            throw new Error("Ethereum provider must be configured for Sepolia to use chain 11155111");
        }
        return {
            chainId: 11155111,
            provider: "ethereum",
            network: "sepolia",
            name: "Ethereum Sepolia",
            rpcUrl: requireConfigured(env.ETHEREUM_RPC, "ETHEREUM_RPC", "Ethereum Sepolia"),
            explorerUrl: "https://sepolia.etherscan.io",
            nativeCurrency: { name: "Sepolia Ether", symbol: "SepoliaETH", decimals: 18 },
            medicalRecordAddress: requireConfigured(env.MEDICAL_RECORD_ADDRESS, "MEDICAL_RECORD_ADDRESS", "Ethereum Sepolia"),
            accessControlAddress: env.ACCESS_CONTROL_ADDRESS?.trim() || undefined,
        };
    }

    if (chainId === 80002) {
        if (env.POLYGON_NETWORK.toLowerCase() !== "amoy") {
            throw new Error("Polygon provider must be configured for Amoy to use chain 80002");
        }
        return {
            chainId: 80002,
            provider: "polygon",
            network: "amoy",
            name: "Polygon Amoy",
            rpcUrl: requireConfigured(env.POLYGON_RPC, "POLYGON_RPC", "Polygon Amoy"),
            explorerUrl: "https://amoy.polygonscan.com",
            nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
            medicalRecordAddress: requireConfigured(env.POLYGON_MEDICAL_RECORD_ADDRESS, "POLYGON_MEDICAL_RECORD_ADDRESS", "Polygon Amoy"),
            accessControlAddress: env.POLYGON_ACCESS_CONTROL_ADDRESS?.trim() || undefined,
        };
    }

    throw new Error(`Unsupported blockchain chain ID: ${chainId}. Supported networks are Ethereum Sepolia (11155111) and Polygon Amoy (80002).`);
}

export function getDefaultSupportedEvmNetwork(): SupportedEvmNetwork {
    const provider = process.env.BLOCKCHAIN_PROVIDER?.toLowerCase();
    if (provider === "ethereum") {
        return getSupportedEvmNetwork(11155111);
    }
    if (provider === "polygon") {
        return getSupportedEvmNetwork(80002);
    }

    throw new Error(`Blockchain provider '${provider ?? "unset"}' does not have a supported EVM default. Send X-CareLink-Chain-Id to choose Sepolia or Amoy.`);
}
