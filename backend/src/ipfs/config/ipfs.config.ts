import { env } from "../../config/env";

export type IpfsProtocol = "http" | "https";

export type IpfsProvider = "kubo" | "pinata";

export interface IIpfsConfig {
    readonly host: string;
    readonly port: number;
    readonly protocol: IpfsProtocol;
    readonly timeout: number;

    readonly provider: IpfsProvider;

    readonly apiUrl: string;
    readonly gatewayUrl: string;

    readonly pinningEndpoint?: string;
}

const DEFAULT_IPFS_HOST = "127.0.0.1";
const DEFAULT_IPFS_PORT = 5001;
const DEFAULT_IPFS_PROTOCOL: IpfsProtocol = "http";
const DEFAULT_IPFS_TIMEOUT = 30_000;

function normalizeProtocol(
    value: string | undefined
): IpfsProtocol {
    return value?.toLowerCase() === "https"
        ? "https"
        : "http";
}

function buildKuboApiUrl(
    protocol: IpfsProtocol,
    host: string,
    port: number
): string {
    return `${protocol}://${host}:${port}/api/v0`;
}

function buildKuboGatewayUrl(
    protocol: IpfsProtocol,
    host: string,
    port: number
): string {
    return `${protocol}://${host}:${port}/ipfs`;
}

const ipfsHost =
    process.env.IPFS_HOST || DEFAULT_IPFS_HOST;

const parsedPort = Number(process.env.IPFS_PORT);

const ipfsPort =
    Number.isInteger(parsedPort) && parsedPort > 0
        ? parsedPort
        : DEFAULT_IPFS_PORT;

const ipfsProtocol =
    normalizeProtocol(process.env.IPFS_PROTOCOL);

const timeout =
    Number(process.env.IPFS_TIMEOUT_MS) > 0
        ? Number(process.env.IPFS_TIMEOUT_MS)
        : DEFAULT_IPFS_TIMEOUT;

/*
 * Pinata is selected only when a JWT is configured.
 * Otherwise the backend uses local/self-hosted Kubo.
 */
const provider: IpfsProvider =
    env.PINATA_JWT.trim().length > 0
        ? "pinata"
        : "kubo";

export const ipfsConfig: IIpfsConfig = {
    host: ipfsHost,
    port: ipfsPort,
    protocol: ipfsProtocol,
    timeout,
    provider,

    apiUrl: buildKuboApiUrl(
        ipfsProtocol,
        ipfsHost,
        ipfsPort
    ),

    gatewayUrl:
        provider === "pinata"
            ? (
                process.env.PINATA_GATEWAY_URL ||
                "https://gateway.pinata.cloud/ipfs"
            )
            : buildKuboGatewayUrl(
                ipfsProtocol,
                ipfsHost,
                ipfsPort
            ),

    pinningEndpoint:
        provider === "pinata"
            ? "https://api.pinata.cloud"
            : undefined
};

export function getIpfsApiUrl(): string {
    return ipfsConfig.apiUrl;
}

export function getIpfsGatewayUrl(): string {
    return ipfsConfig.gatewayUrl;
}

export function getIpfsProvider(): IpfsProvider {
    return ipfsConfig.provider;
}