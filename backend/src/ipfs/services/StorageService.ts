import {
    IStorageOptions
} from "../interfaces/IStorageOptions";

import {
    IFileMetadata
} from "../interfaces/IFileMetadata";

import {
    IUploadResult
} from "../interfaces/IUploadResult";

import {
    UploadService
} from "./UploadService";

import {
    MetadataService
} from "./MetadataService";

export interface IStorageResult {
    upload: IUploadResult;
    metadata: IFileMetadata;
}

export class StorageServiceError
    extends Error {

    constructor(
        message: string,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name =
            "StorageServiceError";
    }
}

export class StorageService {

    private readonly uploadService:
        UploadService;

    private readonly metadataService:
        MetadataService;

    constructor(
        uploadService:
            UploadService =
                new UploadService(),

        metadataService:
            MetadataService =
                new MetadataService()
    ) {

        this.uploadService =
            uploadService;

        this.metadataService =
            metadataService;
    }

    async store(
        input: IStorageOptions
    ): Promise<IStorageResult> {

        try {

            /*
             * Medical-record content must be pinned.
             * This prevents the file from becoming unavailable
             * when it is not referenced by an active IPFS pin.
             */
            const upload =
                await this.uploadService.uploadFile(
                    input.content,
                    {
                        pin: true
                    }
                );

            const metadata =
                this.metadataService
                    .generateMetadata({
                        cid: upload.cid,

                        fileName:
                            input.fileName,

                        mimeType:
                            input.mimeType,

                        fileSize:
                            upload.size,

                        uploadedAt:
                            input.uploadedAt
                    });

            return {
                upload,
                metadata
            };

        } catch (error) {

            /*
             * Metadata validation errors are intentionally
             * propagated unchanged so callers can distinguish
             * invalid metadata from infrastructure failures.
             */
            if (
                error instanceof Error &&
                error.name ===
                    "InvalidMetadataInputError"
            ) {
                throw error;
            }

            throw new StorageServiceError(
                "Failed to store file in IPFS",
                error
            );
        }
    }
}