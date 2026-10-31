import { classifyCrossChainStatus } from "../../controllers/AdminController";

describe("read-only monitoring status classification", () => {
  it.each([
    ["accepted", "submitted"],
    ["relaying", "processing"],
    ["confirmed", "confirmed"],
    ["failed", "failed"],
    ["duplicate", "failed"],
    ["unexpected", "unknown"],
  ])("maps %s without claiming confirmation", (source, expected) => {
    expect(classifyCrossChainStatus(source)).toBe(expected);
  });
});
