import multer from "multer";
import type { Request } from "express";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export const profileAvatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (!allowed.has(file.mimetype)) return cb(new Error("Profile photo must be JPEG, PNG, or WebP."));
    cb(null, true);
  }
}).single("avatar");
