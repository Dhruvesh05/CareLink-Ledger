import {
    ipfsConfig,
    type IIpfsConfig
} from "../config/ipfs.config";

import { env } from "../../config/env";

export interface IIPFSAddResult {
    readonly cid: string;
    readonly path: string;
    readonly size: number;
}

export interface IIPFSClient {
    add(
        content:
            | string
            | Uint8Array
            | Buffer,
        pin?: boolean
    ): Promise<IIPFSAddResult>;

    cat(
        cid: string
    ): Promise<Uint8Array>;

    pin(
        cid: string
    ): Promise<void>;

    unpin(
        cid: string
    ): Promise<void>;

    isPinned(
        cid: string
    ): Promise<boolean>;

    getGatewayUrl(
        cid: string
    ): string;

    ping(): Promise<boolean>;
}

interface IPFSClientLike {
    add(
        content:
            | string
            | Uint8Array
            | Buffer,
        options?: {
            pin?: boolean;
        }
    ): Promise<{
        cid: {
            toString(): string;
        };
        path: string;
        size: number;
    }>;

    cat(
        cid: string
    ): AsyncIterable<Uint8Array>;

    pin: {
        add(
            cid: string
        ): Promise<unknown>;

        rm(
            cid: string
        ): Promise<unknown>;

        ls(
            options: {
                paths: string;
            }
        ): AsyncIterable<{
            cid: {
                toString(): string;
            };
        }>;
    };

    version(): Promise<unknown>;
}

type CreateIPFSClient = (
    options: {
        url: string;
        timeout: number;
    }
) => IPFSClientLike;

interface PinataUploadResponse {
    data?: {
        cid?: string;
        size?: number;
        name?: string;
        mime_type?: string;
    };
}

export class IPFSClient
    implements IIPFSClient {

    private readonly config: IIpfsConfig;

    private clientPromise:
        Promise<IPFSClientLike> | null = null;

    constructor(
        config: IIpfsConfig = ipfsConfig
    ) {
        this.config = config;
    }

    private async getClient():
        Promise<IPFSClientLike> {

        if (!this.clientPromise) {
            this.clientPromise =
                import("ipfs-http-client")
                    .then((module) => {

                        const create =
                            module.create as
                                CreateIPFSClient;

                        return create({
                            url:
                                this.config.apiUrl,

                            timeout:
                                this.config.timeout
                        });
                    });
        }

        return this.clientPromise;
    }

    private getPinataJwt(): string {

        const jwt =
            env.PINATA_JWT.trim();

        if (!jwt) {
            throw new Error(
                "PINATA_JWT is required for the Pinata IPFS provider"
            );
        }

        return jwt;
    }

    private async pinataRequest(
        path: string,
        options: RequestInit = {}
    ): Promise<Response> {

        const controller =
            new AbortController();

        const timeoutId =
            setTimeout(
                () =>
                    controller.abort(),
                this.config.timeout
            );

        try {

            const headers =
                new Headers(
                    options.headers
                );

            headers.set(
                "Authorization",
                `Bearer ${this.getPinataJwt()}`
            );

            return await fetch(
                `${
                    this.config.pinataApiUrl ??
                    "https://api.pinata.cloud"
                }${path}`,
                {
                    ...options,
                    headers,
                    signal:
                        controller.signal
                }
            );

        } finally {

            clearTimeout(timeoutId);
        }
    }

    private async addWithKubo(
        content:
            | string
            | Uint8Array
            | Buffer,
        pin: boolean
    ): Promise<IIPFSAddResult> {

        const client =
            await this.getClient();

        const result =
            await client.add(
                content,
                {
                    pin
                }
            );

        return {
            cid:
                result.cid.toString(),

            path:
                result.path,

            size:
                result.size
        };
    }

    private async addWithPinata(
        content:
            | string
            | Uint8Array
            | Buffer,
        pin: boolean
    ): Promise<IIPFSAddResult> {

        const form =
            new FormData();

        let bytes: Uint8Array;

        if (Buffer.isBuffer(content)) {

            bytes =
                new Uint8Array(content);

        } else if (typeof content === "string") {

            bytes =
                new TextEncoder().encode(
                    content
                );

        } else {

            bytes =
                content;
        }

        const arrayBuffer =
            new ArrayBuffer(
                bytes.byteLength
            );

        new Uint8Array(
            arrayBuffer
        ).set(bytes);

        const blob =
            new Blob([
                arrayBuffer
            ]);

        form.append(
            "file",
            blob,
            "upload"
        );

        form.append(
            "network",
            "public"
        );

        const controller =
            new AbortController();

        const timeoutId =
            setTimeout(
                () =>
                    controller.abort(),
                this.config.timeout
            );

        let response: Response;

        try {

            response =
                await fetch(
                    "https://uploads.pinata.cloud/v3/files",
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${this.getPinataJwt()}`
                        },

                        body:
                            form,

                        signal:
                            controller.signal
                    }
                );

        } finally {

            clearTimeout(timeoutId);
        }

        if (!response.ok) {

            const body =
                await response.text();

            throw new Error(
                `Pinata upload failed (${response.status}): ${body}`
            );
        }

        const result =
            await response.json() as
                PinataUploadResponse;

        const cid =
            result.data?.cid;

        if (!cid) {

            throw new Error(
                "Pinata upload response did not contain a CID"
            );
        }

        void pin;

        return {
            cid,

            path:
                result.data?.name ??
                "upload",

            size:
                result.data?.size ??
                bytes.byteLength
        };
    }

    async add(
        content:
            | string
            | Uint8Array
            | Buffer,
        pin = true
    ): Promise<IIPFSAddResult> {

        if (
            this.config.provider ===
            "pinata"
        ) {

            return this.addWithPinata(
                content,
                pin
            );
        }

        return this.addWithKubo(
            content,
            pin
        );
    }

    private async catWithKubo(
        cid: string
    ): Promise<Uint8Array> {

        const client =
            await this.getClient();

        const chunks:
            Uint8Array[] = [];

        for await (
            const chunk of client.cat(cid)
        ) {

            chunks.push(chunk);
        }

        if (
            chunks.length === 0
        ) {
            return new Uint8Array();
        }

        const totalLength =
            chunks.reduce(
                (
                    total,
                    chunk
                ) =>
                    total + chunk.length,
                0
            );

        const result =
            new Uint8Array(
                totalLength
            );

        let offset = 0;

        for (
            const chunk of chunks
        ) {

            result.set(
                chunk,
                offset
            );

            offset +=
                chunk.length;
        }

        return result;
    }

    private async catWithPinata(
        cid: string
    ): Promise<Uint8Array> {

        const response =
            await fetch(
                this.getGatewayUrl(cid),
                {
                    signal:
                        AbortSignal.timeout(
                            this.config.timeout
                        )
                }
            );

        if (!response.ok) {

            throw new Error(
                `Pinata gateway download failed (${response.status})`
            );
        }

        const buffer =
            await response.arrayBuffer();

        return new Uint8Array(
            buffer
        );
    }

    async cat(
        cid: string
    ): Promise<Uint8Array> {

        if (
            this.config.provider ===
            "pinata"
        ) {

            return this.catWithPinata(
                cid
            );
        }

        return this.catWithKubo(
            cid
        );
    }

        async pin(
        cid: string
    ): Promise<void> {

        if (
            this.config.provider ===
            "pinata"
        ) {

            const response =
                await this.pinataRequest(
                    "/v3/files/public/pin_by_cid",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                cid
                            })
                    }
                );

            if (!response.ok) {

                const body =
                    await response.text();

                throw new Error(
                    `Pinata pin failed (${response.status}): ${body}`
                );
            }

            return;
        }

        const client =
            await this.getClient();

        await client.pin.add(
            cid
        );
    }

    async unpin(
        cid: string
    ): Promise<void> {

        if (
            this.config.provider ===
            "pinata"
        ) {

            /*
             * Pinata v3 file deletion is performed
             * through the file endpoint.
             */
            const response =
                await this.pinataRequest(
                    `/v3/files/public/${encodeURIComponent(cid)}`,
                    {
                        method: "DELETE"
                    }
                );

            if (!response.ok) {

                const body =
                    await response.text();

                throw new Error(
                    `Pinata unpin failed (${response.status}): ${body}`
                );
            }

            return;
        }

        const client =
            await this.getClient();

        await client.pin.rm(
            cid
        );
    }

    async isPinned(
        cid: string
    ): Promise<boolean> {

        const trimmedCid =
            cid.trim();

        if (
            this.config.provider ===
            "pinata"
        ) {

            if (!trimmedCid) {
                return false;
            }

            const response =
                await this.pinataRequest(
                    `/v3/files/public/pin_by_cid?cid=${encodeURIComponent(
                        trimmedCid
                    )}`
                );

            if (!response.ok) {
                return false;
            }

            return true;
        }

        const client =
            await this.getClient();

        const listing =
            client.pin.ls({
                paths:
                    trimmedCid
            });

        for await (
            const entry of listing
        ) {

            if (
                entry.cid.toString() ===
                trimmedCid
            ) {

                return true;
            }
        }

        return false;
    }

    getGatewayUrl(
        cid: string
    ): string {

        return `${
            this.config.gatewayUrl
        }/${encodeURIComponent(cid)}`;
    }

    async ping(): Promise<boolean> {

        try {

            if (
                this.config.provider ===
                "pinata"
            ) {

                const response =
                    await this.pinataRequest(
                        "/data/testAuthentication"
                    );

                return response.ok;
            }

            const client =
                await this.getClient();

            await client.version();

            return true;

        } catch {

            return false;
        }
    }
}

export const ipfsClient =
    new IPFSClient();