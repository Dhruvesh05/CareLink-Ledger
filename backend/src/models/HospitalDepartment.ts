import mongoose, { Document, Schema, Types } from "mongoose";

export interface IHospitalDepartment extends Document {
  hospitalUserId: Types.ObjectId;
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalDepartmentSchema = new Schema<IHospitalDepartment>(
  {
    hospitalUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

HospitalDepartmentSchema.index({ hospitalUserId: 1, name: 1 }, { unique: true });

export default mongoose.models.HospitalDepartment ||
  mongoose.model<IHospitalDepartment>("HospitalDepartment", HospitalDepartmentSchema);
