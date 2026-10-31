import mongoose, { Document, Schema, Types } from "mongoose";

export type AdminAuditCategory = "access" | "consent" | "medical-records" | "verification" | "blockchain" | "administration" | "failure";

export interface IAdminAuditEvent extends Document {
  category: AdminAuditCategory;
  actorUserId?: Types.ObjectId;
  actorRole?: string;
  event: string;
  resource: string;
  resourceId?: string;
  transactionReference?: string;
  result: "success" | "failure";
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AdminAuditEventSchema = new Schema<IAdminAuditEvent>(
  {
    category: { type: String, enum: ["access", "consent", "medical-records", "verification", "blockchain", "administration", "failure"], required: true, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorRole: { type: String, index: true },
    event: { type: String, required: true, maxlength: 160 },
    resource: { type: String, required: true, maxlength: 160 },
    resourceId: { type: String },
    transactionReference: { type: String },
    result: { type: String, enum: ["success", "failure"], required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

export default mongoose.models.AdminAuditEvent ||
  mongoose.model<IAdminAuditEvent>("AdminAuditEvent", AdminAuditEventSchema);
