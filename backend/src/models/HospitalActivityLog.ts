import mongoose, { Document, Schema, Types } from "mongoose";

export interface IHospitalActivityLog extends Document {
  hospitalUserId: Types.ObjectId;
  actorUserId: Types.ObjectId;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const HospitalActivityLogSchema = new Schema<IHospitalActivityLog>(
  {
    hospitalUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, maxlength: 120 },
    resource: { type: String, required: true, maxlength: 120 },
    resourceId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

export default mongoose.models.HospitalActivityLog ||
  mongoose.model<IHospitalActivityLog>("HospitalActivityLog", HospitalActivityLogSchema);
