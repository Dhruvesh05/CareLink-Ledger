import mongoose, { Document, Schema, Types } from "mongoose";

export type InvoiceStatus = "issued" | "paid" | "void";

export interface IInvoiceLineItem {
  description: string;
  quantity: number;
  unitAmountMinor: number;
  totalAmountMinor: number;
}

export interface IInvoiceStatusHistory {
  status: InvoiceStatus;
  changedBy: Types.ObjectId;
  changedAt: Date;
}

export interface IInvoice extends Document {
  patientUserId: Types.ObjectId;
  hospitalUserId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  invoiceNumber: string;
  issueDate: Date;
  description: string;
  lineItems: IInvoiceLineItem[];
  amountMinor: number;
  currency: string;
  status: InvoiceStatus;
  statusHistory: IInvoiceStatusHistory[];
  dueAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    patientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hospitalUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    issueDate: { type: Date, default: Date.now },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    lineItems: { type: [{
      description: { type: String, required: true, trim: true, maxlength: 200 },
      quantity: { type: Number, required: true, min: 1, max: 10000 },
      unitAmountMinor: { type: Number, required: true, min: 0 },
      totalAmountMinor: { type: Number, required: true, min: 0 },
    }], default: [] },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, default: "INR", maxlength: 3 },
    status: { type: String, enum: ["issued", "paid", "void"], default: "issued", index: true },
    statusHistory: { type: [{
      status: { type: String, enum: ["issued", "paid", "void"], required: true },
      changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      changedAt: { type: Date, required: true },
    }], default: [] },
    dueAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.models.Invoice ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema);
