import {
    NextFunction,
    Request,
    RequestHandler,
    Response
} from "express";

import { env } from "../../config/env";

type HttpError =
    Error & {
        status?: number;
    };

type UploadBody = {
    content?: unknown;
    fileName?: unknown;
    mimeType?: unknown;
    uploadedAt?: unknown;
};

type PinBody = {
    cid?: unknown;
};

const DEFAULT_ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "text/plain",
    "application/json"
];

const MAX_UPLOAD_SIZE_BYTES =
    env.IPFS_MAX_UPLOAD_SIZE_BYTES;

const ALLOWED_MIME_TYPES =
    new Set(
        (
            env.IPFS_ALLOWED_MIME_TYPES ||
            DEFAULT_ALLOWED_MIME_TYPES.join(",")
        )
            .split(",")
            .map(type => type.trim())
            .filter(Boolean)
    );

function httpError(
    status: number,
    message: string
): HttpError {

    const error =
        new Error(message) as HttpError;

    error.status = status;

    return error;
}

function nonEmptyString(
    value: unknown
): value is string {

    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
}

function validateCid(
    value: unknown
): string {

    if (!nonEmptyString(value)) {
        throw httpError(
            400,
            "cid is required"
        );
    }

    const cid =
        value.trim();

    if (/\s/.test(cid)) {
        throw httpError(
            400,
            "cid must not contain whitespace"
        );
    }

    if (!/^[A-Za-z0-9]+$/.test(cid)) {
        throw httpError(
            400,
            "cid format is invalid"
        );
    }

    return cid;
}

function getContentSize(
    content: unknown
): number {

    if (Buffer.isBuffer(content)) {
        return content.length;
    }

    if (content instanceof Uint8Array) {
        return content.byteLength;
    }

    if (typeof content === "string") {
        return Buffer.byteLength(
            content,
            "utf8"
        );
    }

    return 0;
}

export const validateIpfsFileExistence:
    RequestHandler =
        (
            req: Request,
            _res: Response,
            next: NextFunction
        ) => {

            try {

                const body =
                    req.body as UploadBody;

                if (
                    !Buffer.isBuffer(
                        body.content
                    ) &&
                    !(
                        body.content instanceof
                        Uint8Array
                    ) &&
                    !nonEmptyString(
                        body.content
                    )
                ) {
                    throw httpError(
                        400,
                        "file content is required"
                    );
                }

                next();

            } catch (error) {

                next(error);
            }
        };

export const validateIpfsCidParam:
    RequestHandler =
        (
            req,
            _res,
            next
        ) => {

            try {

                validateCid(
                    req.params.cid
                );

                next();

            } catch (error) {

                next(error);
            }
        };

export const validateIpfsPinBody:
    RequestHandler =
        (
            req,
            _res,
            next
        ) => {

            try {

                validateCid(
                    (req.body as PinBody).cid
                );

                next();

            } catch (error) {

                next(error);
            }
        };

export const validateIpfsUploadContentSize:
    RequestHandler =
        (
            req,
            _res,
            next
        ) => {

            try {

                const size =
                    getContentSize(
                        (req.body as UploadBody)
                            .content
                    );

                if (
                    size >
                    MAX_UPLOAD_SIZE_BYTES
                ) {
                    throw httpError(
                        413,
                        `file exceeds maximum upload size of ${MAX_UPLOAD_SIZE_BYTES} bytes`
                    );
                }

                next();

            } catch (error) {

                next(error);
            }
        };

export const validateIpfsAllowedMimeType:
    RequestHandler =
        (
            req,
            _res,
            next
        ) => {

            try {

                const body =
                    req.body as UploadBody;

                if (
                    !nonEmptyString(
                        body.mimeType
                    )
                ) {
                    throw httpError(
                        400,
                        "mimeType is required"
                    );
                }

                const mimeType =
                    body.mimeType.trim();

                if (
                    !ALLOWED_MIME_TYPES.has(
                        mimeType
                    )
                ) {
                    throw httpError(
                        415,
                        `mimeType '${mimeType}' is not allowed`
                    );
                }

                next();

            } catch (error) {

                next(error);
            }
        };

export const validateIpfsRequestBodyFields:
    RequestHandler =
        (
            req,
            _res,
            next
        ) => {

            try {

                const body =
                    req.body as UploadBody;

                if (
                    !nonEmptyString(
                        body.fileName
                    )
                ) {
                    throw httpError(
                        400,
                        "fileName is required"
                    );
                }

                if (
                    !nonEmptyString(
                        body.mimeType
                    )
                ) {
                    throw httpError(
                        400,
                        "mimeType is required"
                    );
                }

                next();

            } catch (error) {

                next(error);
            }
        };

export const ipfsUploadValidationMiddleware = [
    validateIpfsRequestBodyFields,
    validateIpfsFileExistence,
    validateIpfsAllowedMimeType,
    validateIpfsUploadContentSize
];

export const ipfsCidValidationMiddleware = [
    validateIpfsCidParam
];

export const ipfsPinValidationMiddleware = [
    validateIpfsPinBody
];