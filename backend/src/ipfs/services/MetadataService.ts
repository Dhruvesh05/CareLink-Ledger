import {
    IFileMetadata
} from "../interfaces/IFileMetadata";

interface MetadataInput {
    cid: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uploadedAt?: Date | string;
}

export class InvalidMetadataInputError
    extends Error {

    constructor(
        message: string
    ) {
        super(message);
        this.name =
            "InvalidMetadataInputError";
    }
}

export class MetadataService {

    generateMetadata(
        input: MetadataInput
    ): IFileMetadata {

        const cid =
            input.cid.trim();

        const fileName =
            input.fileName.trim();

        const mimeType =
            input.mimeType.trim();

        if (!cid) {
            throw new InvalidMetadataInputError(
                "CID is required"
            );
        }

        if (!fileName) {
            throw new InvalidMetadataInputError(
                "File name is required"
            );
        }

        if (!mimeType) {
            throw new InvalidMetadataInputError(
                "MIME type is required"
            );
        }

        if (
            !Number.isFinite(
                input.fileSize
            ) ||
            input.fileSize < 0
        ) {
            throw new InvalidMetadataInputError(
                "File size must be a valid non-negative number"
            );
        }

        let uploadedAt: Date;

        if (
            input.uploadedAt instanceof Date
        ) {

            uploadedAt =
                input.uploadedAt;

        } else if (
            typeof input.uploadedAt ===
            "string"
        ) {

            uploadedAt =
                new Date(
                    input.uploadedAt
                );

        } else {

            uploadedAt =
                new Date();
        }

        if (
            Number.isNaN(
                uploadedAt.getTime()
            )
        ) {
            throw new InvalidMetadataInputError(
                "Uploaded timestamp is invalid"
            );
        }

        return {
            cid,
            fileName,
            mimeType,
            fileSize:
                input.fileSize,
            uploadedAt:
                uploadedAt.toISOString()
        };
    }
}