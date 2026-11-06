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

export type AccessPermissionType = "READ_ONLY" | "COMMENT_ONLY";

export interface AccessRecordReference {
  chainId: number;
  contractAddress: string;
  recordId: number;
}

export interface IAccessRequest extends Document {
  doctorUserId: Types.ObjectId;
  patientUserId: Types.ObjectId;
  reason: string;
  scope: "medical_records";
  permissionType?: AccessPermissionType;
  recordIds?: number[];
  recordRefs?: AccessRecordReference[];
  consentNonce?: string;
  consentMessage?: string;
  consentSignature?: string;
  consentDomain?: string;
  consentApprovedAt?: Date;
  revocationNonce?: string;
  revocationMessage?: string;
  revocationSignature?: string;
  revokedAt?: Date;
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
      permissionType: {
        type: String,
        enum: ["READ_ONLY", "COMMENT_ONLY"],
        required: true,
        default: "READ_ONLY",
      },
      recordIds: {
        type: [Number],
        default: undefined,
        minlength: 1,
        validate: {
          validator: (value: number[]) =>
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((recordId) => Number.isSafeInteger(recordId) && recordId > 0),
          message: "At least one valid medical record ID is required",
        },
      },
      recordRefs: {
        type: [{
          chainId: { type: Number, required: true },
          contractAddress: { type: String, required: true, lowercase: true, trim: true },
          recordId: { type: Number, required: true },
        }],
        default: undefined,
      },
      consentNonce: { type: String, index: true },
      consentMessage: { type: String },
      consentSignature: { type: String },
      consentDomain: { type: String },
      consentApprovedAt: { type: Date },
      revocationNonce: { type: String },
      revocationMessage: { type: String },
      revocationSignature: { type: String },
      revokedAt: { type: Date },
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
