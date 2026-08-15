import {
    ipfsConfig,
    type IIpfsConfig
} from "../config/ipfs.config";

export interface IIPFSAddResult {
    readonly cid: string;
    readonly path: string;
    readonly size: number;
}

export interface IIPFSClient {
    add(
        content: string | Uint8Array | Buffer,
        pin?: boolean
    ): Promise<IIPFSAddResult>;

    cat(cid: string): Promise<Uint8Array>;

    pin(cid: string): Promise<void>;

    unpin(cid: string): Promise<void>;

    isPinned(cid: string): Promise<boolean>;

    getGatewayUrl(cid: string): string;

    ping(): Promise<boolean>;
}

interface IPFSClientLike {
    add(
        content: string | Uint8Array | Buffer,
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
        add(cid: string): Promise<unknown>;
        rm(cid: string): Promise<unknown>;
        ls(options: {
            paths: string;
        }): AsyncIterable<{
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

export class IPFSClient implements IIPFSClient {

    private readonly config: IIpfsConfig;

    private clientPromise:
        Promise<IPFSClientLike> | null = null;

    constructor(
        config: IIpfsConfig = ipfsConfig
    ) {
        this.config = config;
    }

    private async getClient(): Promise<IPFSClientLike> {

        if (!this.clientPromise) {

            this.clientPromise =
                import("ipfs-http-client")
                    .then(
                        (module) => {

                            const create =
                                module.create as CreateIPFSClient;

                            return create({
                                url: this.config.apiUrl,
                                timeout: this.config.timeout
                            });
                        }
                    );
        }

        return this.clientPromise;
    }

    async add(
        content: string | Uint8Array | Buffer,
        pin = true
    ): Promise<IIPFSAddResult> {

        const client =
            await this.getClient();

        const result =
            await client.add(
                content,
                { pin }
            );

        return {
            cid: result.cid.toString(),
            path: result.path,
            size: result.size
        };
    }

    async cat(
        cid: string
    ): Promise<Uint8Array> {

        const client =
            await this.getClient();

        const chunks: Uint8Array[] = [];

        for await (
            const chunk of client.cat(cid)
        ) {
            chunks.push(chunk);
        }

        if (chunks.length === 0) {
            return new Uint8Array();
        }

        const totalLength =
            chunks.reduce(
                (total, chunk) =>
                    total + chunk.length,
                0
            );

        const result =
            new Uint8Array(totalLength);

        let offset = 0;

        for (const chunk of chunks) {

            result.set(
                chunk,
                offset
            );

            offset += chunk.length;
        }

        return result;
    }

    async pin(
        cid: string
    ): Promise<void> {

        const client =
            await this.getClient();

        await client.pin.add(cid);
    }

    async unpin(
        cid: string
    ): Promise<void> {

        const client =
            await this.getClient();

        await client.pin.rm(cid);
    }

    async isPinned(
        cid: string
    ): Promise<boolean> {

        const client =
            await this.getClient();

        const trimmedCid =
            cid.trim();

        const listing =
            client.pin.ls({
                paths: trimmedCid
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

        return `${this.config.gatewayUrl}/${encodeURIComponent(cid)}`;
    }

    async ping(): Promise<boolean> {

        try {

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
