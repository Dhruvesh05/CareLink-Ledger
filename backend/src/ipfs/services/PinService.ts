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

export class PinServiceError
    extends Error {

    constructor(
        message: string,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name =
            "PinServiceError";
    }
}

function validateCid(
    cid: string
): string {

    const value =
        cid.trim();

    if (!value) {
        throw new InvalidCidError(
            "CID is required"
        );
    }

    if (/\s/.test(value)) {
        throw new InvalidCidError(
            "CID must not contain whitespace"
        );
    }

    return value;
}

export class PinService {

    private readonly client:
        IIPFSClient;

    constructor(
        client: IIPFSClient =
            ipfsClient
    ) {

        this.client = client;
    }

    async pinCid(
        cid: string
    ): Promise<void> {

        const normalized =
            validateCid(cid);

        try {

            await this.client.pin(
                normalized
            );

        } catch (error) {

            throw new PinServiceError(
                "Failed to pin CID on IPFS",
                error
            );
        }
    }

    async unpinCid(
        cid: string
    ): Promise<void> {

        const normalized =
            validateCid(cid);

        try {

            await this.client.unpin(
                normalized
            );

        } catch (error) {

            throw new PinServiceError(
                "Failed to unpin CID on IPFS",
                error
            );
        }
    }

    async isPinned(
        cid: string
    ): Promise<boolean> {

        const normalized =
            validateCid(cid);

        try {

            return await this.client
                .isPinned(normalized);

        } catch (error) {

            const message =
                error instanceof Error
                    ? error.message
                    : "";

            if (
                message
                    .toLowerCase()
                    .includes("cid")
            ) {
                throw new InvalidCidError(
                    "Invalid CID"
                );
            }

            throw new PinServiceError(
                "Failed to check CID pin status on IPFS",
                error
            );
        }
    }
}