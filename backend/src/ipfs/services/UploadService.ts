import {
    ipfsClient,
    IIPFSClient
} from "../client/IPFSClient";

export interface UploadOptions {
    pin?: boolean;
}

export interface UploadResult {
    cid: string;
    path: string;
    size: number;
    gatewayUrl: string;
}

export class UploadServiceError
    extends Error {

    constructor(
        message: string,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name =
            "UploadServiceError";
    }
}

export class UploadService {

    private readonly client:
        IIPFSClient;

    constructor(
        client: IIPFSClient =
            ipfsClient
    ) {

        this.client = client;
    }

    async uploadFile(
        content:
            Buffer |
            Uint8Array |
            string,

        options: UploadOptions = {}
    ): Promise<UploadResult> {

        try {

            /*
             * Medical records must remain available after upload.
             * Therefore pinning is enabled by default.
             */
            const pin =
                options.pin ?? true;

            const result =
                await this.client.add(
                    content,
                    pin
                );

            return {
                cid: result.cid,
                path: result.path,
                size: result.size,
                gatewayUrl:
                    this.client.getGatewayUrl(
                        result.cid
                    )
            };

        } catch (error) {

            throw new UploadServiceError(
                "Failed to upload content to IPFS",
                error
            );
        }
    }

    async uploadText(
        content: string,
        options: UploadOptions = {}
    ): Promise<UploadResult> {

        return this.uploadFile(
            content,
            options
        );
    }
}