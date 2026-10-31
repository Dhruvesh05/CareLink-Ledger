import mongoose, { Document, Schema, Types } from "mongoose";

export type AccessRequestStatus =
  | "pending"
  | "awaiting_patient_signature"
  | "transaction_submitted"
  | "active"
  | "rejected"
  | "revoked"
  | "expired"
  | "failed";

export interface IAccessRequest extends Document {
  doctorUserId: Types.ObjectId;
  patientUserId: Types.ObjectId;
  reason: string;
  scope: "medical_records";
  expiresAt?: Date;
  status: AccessRequestStatus;
  transactionHashes: string[];
  history: Array<{ status: AccessRequestStatus; changedAt: Date; changedBy: Types.ObjectId; note?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const AccessRequestSchema = new Schema<IAccessRequest>(
  {
    doctorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    patientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    scope: { type: String, enum: ["medical_records"], required: true },
    expiresAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "awaiting_patient_signature", "transaction_submitted", "active", "rejected", "revoked", "expired", "failed"],
      default: "pending",
      index: true,
    },
    transactionHashes: { type: [String], default: [] },
    history: { type: [{
      status: { type: String, required: true },
      changedAt: { type: Date, required: true },
      changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      note: { type: String, maxlength: 500 },
    }], default: [] },
  },
  { timestamps: true, versionKey: false },
);

AccessRequestSchema.index(
  { doctorUserId: 1, patientUserId: 1, status: 1 },
  { partialFilterExpression: { status: "pending" }, unique: true },
);

export default mongoose.models.AccessRequest ||
  mongoose.model<IAccessRequest>("AccessRequest", AccessRequestSchema);
