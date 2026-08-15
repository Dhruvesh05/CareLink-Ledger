import {
    ipfsClient,
    IIPFSClient
} from "../client/IPFSClient";

export class InvalidCidError
    extends Error {

    constructor(
        message = "Invalid CID"
    ) {
        super(message);
        this.name =
            "InvalidCidError";
    }
}

export class DownloadServiceError
    extends Error {

    constructor(
        message: string,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name =
            "DownloadServiceError";
    }
}

export class DownloadService {

    private readonly client:
        IIPFSClient;

    constructor(
        client: IIPFSClient =
            ipfsClient
    ) {

        this.client = client;
    }

    async downloadFile(
        cid: string
    ): Promise<Buffer> {

        const normalized =
            cid.trim();

        if (!normalized) {
            throw new InvalidCidError(
                "CID is required"
            );
        }

        try {

            const data =
                await this.client.cat(
                    normalized
                );

            return Buffer.from(data);

        } catch (error) {

            const message =
                error instanceof Error
                    ? error.message
                    : String(error);

            if (
                message
                    .toLowerCase()
                    .includes("cid")
            ) {
                throw new InvalidCidError(
                    "Invalid CID"
                );
            }

            throw new DownloadServiceError(
                "Failed to download content from IPFS",
                error
            );
        }
    }
}