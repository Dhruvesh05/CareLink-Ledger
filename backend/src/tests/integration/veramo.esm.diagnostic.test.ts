import { describe, expect, it } from "@jest/globals";

describe("Veramo ESM diagnostic", () => {
    it("loads @veramo/utils", async () => {
        const utils = await import("@veramo/utils");
        expect(utils).toBeDefined();
    });
});