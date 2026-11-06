import mongoose, { Document, Schema, Types } from "mongoose";
import type { AccessRecordReference } from "./AccessRequest";

export interface IRecordComment extends Document {
  patientUserId: Types.ObjectId;
  doctorUserId: Types.ObjectId;
  accessRequestId: Types.ObjectId;
  recordRef: AccessRecordReference;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecordCommentSchema = new Schema<IRecordComment>(
  {
    patientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    accessRequestId: { type: Schema.Types.ObjectId, ref: "AccessRequest", required: true, index: true },
    recordRef: {
      chainId: { type: Number, required: true },
      contractAddress: { type: String, required: true, lowercase: true, trim: true },
      recordId: { type: Number, required: true },
    },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true, versionKey: false },
);

RecordCommentSchema.index({
  "recordRef.chainId": 1,
  "recordRef.contractAddress": 1,
  "recordRef.recordId": 1,
  createdAt: -1,
});

export default mongoose.models.RecordComment ||
  mongoose.model<IRecordComment>("RecordComment", RecordCommentSchema);
