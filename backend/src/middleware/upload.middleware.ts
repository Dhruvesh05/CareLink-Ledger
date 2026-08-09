import multer from "multer";
import { Request, Response, NextFunction } from "express";

// Memory storage - never write files to disk
export const storage = multer.memoryStorage();

// Allowed mime types and corresponding extensions
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    "application/pdf": [".pdf"],
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"]
};

export const upload = multer({
    storage,
    limits: {
        // 10 MB default limit; adjust as needed
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (!file || !file.mimetype) {
            return cb(new Error("Missing file or mime type"));
        }

        if (ALLOWED_MIME_TYPES[file.mimetype]) {
            return cb(null, true);
        }

        return cb(new Error("Unsupported file type"));
    }
});

// Simple middleware to ensure a single file was uploaded
export function requireFile(req: Request, res: Response, next: NextFunction) {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Missing file upload"
        });
    }

    // basic sanity: ensure buffer is present
    if (!req.file.buffer || !(req.file.buffer instanceof Buffer)) {
        return res.status(400).json({
            success: false,
            message: "Uploaded file is not available in memory"
        });
    }

    next();
}

export default upload;
