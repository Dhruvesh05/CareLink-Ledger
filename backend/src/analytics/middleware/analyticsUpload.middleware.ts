import multer from "multer";
import { NextFunction, Request, Response } from "express";

import { env } from "../../config/env";

const SUPPORTED_EXTENSIONS = new Set([
    ".csv",
    ".xlsx",
    ".xls",
    ".json"
]);

const storage = multer.memoryStorage();

export const analyticsUpload = multer({
    storage,
    limits: {
        fileSize: env.ANALYTICS_UPLOAD_MAX_BYTES
    },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const fileName = file.originalname.trim().toLowerCase();
        const extension = fileName.slice(fileName.lastIndexOf("."));

        if (!SUPPORTED_EXTENSIONS.has(extension)) {
            return cb(new Error("Analytics upload must be CSV, XLSX, XLS, or JSON"));
        }

        return cb(null, true);
    }
});

export function requireAnalyticsFile(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Missing file upload"
        });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Uploaded file must not be empty"
        });
    }

    return next();
}

export function handleAnalyticsUploadError(
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
) {
    if (!(error instanceof multer.MulterError) && !(error instanceof Error)) {
        return next(error);
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            success: false,
            message: "Analytics upload exceeds the maximum allowed size"
        });
    }

    return res.status(400).json({
        success: false,
        message: error.message || "Invalid Analytics upload"
    });
}

