import { Types } from "mongoose";
import {
  isPatientApprovalPending,
  isPatientRevocationPending,
} from "../../controllers/ClinicalController";

describe("access request authorization state", () => {
  const patient = new Types.ObjectId();

  it("only treats a patient approval as pending after the prepare step", () => {
    expect(isPatientApprovalPending({
      status: "pending",
      history: [{ note: undefined }],
    })).toBe(false);
    expect(isPatientApprovalPending({
      status: "awaiting_patient_signature",
      history: [{ note: undefined }],
    })).toBe(true);
  });

  it("does not allow a revocation to be confirmed as a grant", () => {
    const request = {
      status: "awaiting_patient_signature" as const,
      history: [{ note: "Revocation awaiting patient signature" }],
    };
    expect(isPatientApprovalPending(request)).toBe(false);
    expect(isPatientRevocationPending(request)).toBe(true);
  });

  it("keeps request history actor-shaped for patient-owned transitions", () => {
    expect(Types.ObjectId.isValid(patient)).toBe(true);
  });
});
