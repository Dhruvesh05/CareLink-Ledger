import {
    NextFunction,
    Request,
    Response
} from "express";

import {
    DownloadService
} from "../ipfs/services/DownloadService";

import {
    PinService
} from "../ipfs/services/PinService";

import {
    StorageService
} from "../ipfs/services/StorageService";

export class IPFSController {

    private readonly storageService:
        StorageService;

    private readonly downloadService:
        DownloadService;

    private readonly pinService:
        PinService;

    constructor(
        storageService:
            StorageService =
                new StorageService(),

        downloadService:
            DownloadService =
                new DownloadService(),

        pinService:
            PinService =
                new PinService()
    ) {

        this.storageService =
            storageService;

        this.downloadService =
            downloadService;

        this.pinService =
            pinService;
    }

    async upload(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const content =
                req.body.content;

            const fileName =
                req.body.fileName;

            const mimeType =
                req.body.mimeType;

            if (
                typeof fileName !==
                "string" ||
                !fileName.trim()
            ) {
                res.status(400).json({
                    success: false,
                    message:
                        "fileName is required"
                });

                return;
            }

            if (
                typeof mimeType !==
                "string" ||
                !mimeType.trim()
            ) {
                res.status(400).json({
                    success: false,
                    message:
                        "mimeType is required"
                });

                return;
            }

            const result =
                await this.storageService.store({
                    content,
                    fileName,
                    mimeType,
                    uploadedAt:
                        req.body.uploadedAt
                });

            res.status(201).json({
                success: true,
                message:
                    "File uploaded successfully",
                data: result
            });

        } catch (error) {

            next(error);
        }
    }

    async download(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const cid =
                String(
                    req.params.cid
                ).trim();

            const file =
                await this.downloadService
                    .downloadFile(cid);

            res.status(200);

            res.setHeader(
                "Content-Type",
                "application/octet-stream"
            );

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${cid}"`
            );

            res.send(file);

        } catch (error) {

            next(error);
        }
    }

    async pin(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const cid =
                String(
                    req.body.cid
                ).trim();

            await this.pinService
                .pinCid(cid);

            res.status(200).json({
                success: true,
                message:
                    "CID pinned successfully",
                cid
            });

        } catch (error) {

            next(error);
        }
    }

    async unpin(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const cid =
                String(
                    req.params.cid
                ).trim();

            await this.pinService
                .unpinCid(cid);

            res.status(200).json({
                success: true,
                message:
                    "CID unpinned successfully",
                cid
            });

        } catch (error) {

            next(error);
        }
    }

    async pinStatus(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        try {

            const cid =
                String(
                    req.params.cid
                ).trim();

            const pinned =
                await this.pinService
                    .isPinned(cid);

            res.status(200).json({
                success: true,
                cid,
                pinned
            });

        } catch (error) {

            next(error);
        }
    }
}

export const ipfsController =
    new IPFSController();