import { Types } from "mongoose";
import AccessRequestModel from "../../models/AccessRequest";
import RecordCommentModel from "../../models/RecordComment";

describe("consent correction persistence", () => {
  const doctorUserId = new Types.ObjectId();
  const patientUserId = new Types.ObjectId();

  it("accepts historical requests without recordIds without granting new scope", () => {
    const historical = new AccessRequestModel({
      doctorUserId,
      patientUserId,
      reason: "Historical request",
      scope: "medical_records",
      status: "active",
      history: [],
    });

    expect(historical.validateSync()).toBeUndefined();
    expect(historical.recordIds).toBeUndefined();
    expect(historical.recordRefs).toBeUndefined();
  });

  it("represents an unscopeable request without silently inventing records", () => {
    const request = new AccessRequestModel({
      doctorUserId,
      patientUserId,
      reason: "Read one record",
      scope: "medical_records",
      permissionType: "READ_ONLY",
      recordIds: [],
      recordRefs: [],
      status: "pending",
      history: [],
    });

    expect(request.recordIds).toEqual([]);
    expect(request.recordRefs).toEqual([]);
  });

  it("stores comments against exact chain-aware record references", () => {
    const comment = new RecordCommentModel({
      patientUserId,
      doctorUserId,
      accessRequestId: new Types.ObjectId(),
      recordRef: {
        chainId: 80002,
        contractAddress: "0x0000000000000000000000000000000000000001",
        recordId: 42,
      },
      content: "Follow-up requested",
    });

    expect(comment.validateSync()).toBeUndefined();
    expect(comment.recordRef).toMatchObject({
      chainId: 80002,
      recordId: 42,
    });
  });
});
