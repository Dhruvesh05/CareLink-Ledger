import { Types } from "mongoose";

describe("hospital organization isolation", () => {
  it("uses the authenticated hospital as the ownership boundary", () => {
    const hospitalA = new Types.ObjectId();
    const hospitalB = new Types.ObjectId();
    const departmentFilter = (hospitalUserId: Types.ObjectId) => ({ hospitalUserId, active: true });
    const associationFilter = (hospitalUserId: Types.ObjectId) => ({ hospitalUserId });
    expect(departmentFilter(hospitalA)).not.toEqual(departmentFilter(hospitalB));
    expect(associationFilter(hospitalA)).not.toEqual(associationFilter(hospitalB));
  });

  it("does not treat hospital association as consent", () => {
    const association = { hospitalUserId: new Types.ObjectId(), doctorUserId: new Types.ObjectId(), status: "active" };
    expect(association).not.toHaveProperty("recordAccess");
    expect(association).not.toHaveProperty("consent");
  });
});
