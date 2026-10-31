import type { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import UserModel from "../models/User";
import UserProfileModel, { IUserProfile } from "../models/UserProfile";

function validImage(buffer: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/webp") return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return false;
}

export class ProfileController {
  private bucket(){
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB is not connected");
    return new mongoose.mongo.GridFSBucket(db, { bucketName: "profile_avatars" });
  }

  private async load(req: Request): Promise<{ user: any; profile: IUserProfile }> {
    const id = req.auth?.userId;
    if (!id || !Types.ObjectId.isValid(id)) throw Object.assign(new Error("Authenticated user not found"), { status: 401 });
    const user = await UserModel.findById(id);
    if (!user || !user.active) throw Object.assign(new Error("User account is unavailable"), { status: 401 });
    const profile = await UserProfileModel.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, role: user.role, displayName: "", email: "", phone: "" } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    if (!profile) throw new Error("Unable to load profile");
    return { user, profile };
  }

  private async dto(profile: IUserProfile) {
    let avatarDataUrl: string | null = null;
    if (profile.avatarFileId && profile.avatarContentType) {
      try {
        const chunks: Buffer[] = [];
        const stream = this.bucket().openDownloadStream(profile.avatarFileId);
        for await (const chunk of stream) chunks.push(Buffer.from(chunk));
        avatarDataUrl = `data:${profile.avatarContentType};base64,${Buffer.concat(chunks).toString("base64")}`;
      } catch (error) {
        console.error("[profile] avatar read failed:", error);
      }
    }
    return {
      id: profile._id.toString(),
      role: profile.role,
      displayName: profile.displayName,
      email: profile.email,
      phone: profile.phone,
      professionalBio: profile.professionalBio ?? "",
      website: profile.website ?? "",
      contactAddress: profile.contactAddress ?? "",
      avatarDataUrl,
      updatedAt: profile.updatedAt
    };
  }

  private fail(res: Response, error: unknown) {
    const status = typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: number }).status) || 500 : 500;
    return res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : "Profile operation failed"
    });
  }

  async getMe(req: Request, res: Response) {
    try {
      const { profile } = await this.load(req);
      return res.json({ success: true, data: await this.dto(profile) });
    } catch (error) { return this.fail(res, error); }
  }

  async updateMe(req: Request, res: Response) {
    try {
      const { user, profile } = await this.load(req);
      if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ success: false, message: "Profile data is required" });
      }

      const common = ["displayName", "email", "phone"];
      const fields: Record<string, string[]> = {
        Patient: common,
        Doctor: [...common, "professionalBio"],
        Hospital: [...common, "website", "contactAddress"],
        Admin: common
      };
      const allowed = new Set(fields[user.role] ?? common);
      const keys = Object.keys(req.body);
      const invalid = keys.filter(key => !allowed.has(key));
      if (invalid.length) return res.status(400).json({
        success: false, message: `Fields not editable for this role: ${invalid.join(", ")}`
      });

      const updates: Record<string, string> = {};
      for (const key of keys) {
        if (typeof req.body[key] !== "string") return res.status(400).json({ success: false, message: `${key} must be text` });
        updates[key] = req.body[key].trim();
      }
      if ("displayName" in updates && !updates.displayName) return res.status(400).json({ success: false, message: "Display name is required" });
      if ("email" in updates && updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
        return res.status(400).json({ success: false, message: "Enter a valid email address" });
      }
      if ("phone" in updates && updates.phone && updates.phone.length < 5) return res.status(400).json({ success: false, message: "Enter a valid phone number" });
      if ("website" in updates && updates.website) {
        try { const u = new URL(updates.website); if (!["http:", "https:"].includes(u.protocol)) throw new Error(); }
        catch { return res.status(400).json({ success: false, message: "Website must be a valid HTTP/HTTPS URL" }); }
      }
      for (const [key, value] of Object.entries(updates)) (profile as any).set(key, value);
      profile.role = user.role;
      await profile.save();
      return res.json({ success: true, data: await this.dto(profile) });
    } catch (error) { return this.fail(res, error); }
  }

  async uploadAvatar(req: Request, res: Response) {
    let newId: Types.ObjectId | undefined;
    try {
      const file = req.file;
      if (!file?.buffer?.length) return res.status(400).json({ success: false, message: "Select a profile image" });
      if (file.size > 2 * 1024 * 1024 || !validImage(file.buffer, file.mimetype)) {
        return res.status(400).json({ success: false, message: "Invalid image or image exceeds 2 MB" });
      }
      const { profile } = await this.load(req);
      const bucket = this.bucket();
      const oldId = profile.avatarFileId;
      const stream = bucket.openUploadStream(`avatar-${profile.userId}-${Date.now()}`, {
  metadata: {
    ownerUserId: profile.userId.toString(),
    purpose: "profile-avatar",
    contentType: file.mimetype
  }
});
      newId = stream.id as Types.ObjectId;
      await new Promise<void>((resolve, reject) => {
        stream.once("finish", resolve);
        stream.once("error", reject);
        stream.end(file.buffer);
      });
      profile.avatarFileId = newId;
      profile.avatarContentType = file.mimetype;
      try { await profile.save(); }
      catch (error) { await bucket.delete(newId).catch(() => undefined); throw error; }
      if (oldId) await bucket.delete(oldId).catch(error => console.error("[profile] old avatar cleanup failed:", error));
      return res.json({ success: true, data: await this.dto(profile) });
    } catch (error) { return this.fail(res, error); }
  }

  async deleteAvatar(req: Request, res: Response) {
    try {
      const { profile } = await this.load(req);
      const oldId = profile.avatarFileId;
      profile.avatarFileId = undefined;
      profile.avatarContentType = undefined;
      await profile.save();
      if (oldId) await this.bucket().delete(oldId).catch(error => console.error("[profile] avatar cleanup failed:", error));
      return res.json({ success: true, data: await this.dto(profile) });
    } catch (error) { return this.fail(res, error); }
  }
}

export default ProfileController;
