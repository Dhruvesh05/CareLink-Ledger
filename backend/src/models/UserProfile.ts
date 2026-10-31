import mongoose, { Schema, Types, Document } from "mongoose";
import type { UserRole } from "./User";

export interface IUserProfile extends Document {
  userId: Types.ObjectId;
  role: UserRole;
  displayName: string;
  email: string;
  phone: string;
  professionalBio?: string;
  website?: string;
  contactAddress?: string;
  avatarFileId?: Types.ObjectId;
  avatarContentType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  role: { type: String, enum: ["Admin", "Patient", "Doctor", "Hospital"], required: true, index: true },
  displayName: { type: String, trim: true, default: "", maxlength: 120 },
  email: { type: String, trim: true, lowercase: true, default: "", maxlength: 254 },
  phone: { type: String, trim: true, default: "", maxlength: 25 },
  professionalBio: { type: String, trim: true, default: "", maxlength: 1000 },
  website: { type: String, trim: true, default: "", maxlength: 250 },
  contactAddress: { type: String, trim: true, default: "", maxlength: 500 },
  avatarFileId: { type: Schema.Types.ObjectId, required: false },
  avatarContentType: { type: String, required: false }
}, { timestamps: true, versionKey: false });

export const UserProfileModel = mongoose.models.UserProfile ||
  mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);
export default UserProfileModel;
