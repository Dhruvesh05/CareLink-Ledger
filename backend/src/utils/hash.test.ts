import {
    sha256FromBuffer,
    verifySha256,
} from "./hash";

describe("hash utilities", () => {
    const buffer = Buffer.from("CareLink Ledger");

    it("generates a deterministic SHA-256 hash", () => {
        expect(sha256FromBuffer(buffer)).toBe(
            "75f2b08ee2d705bae3daac8a528d8ab02bfd3010e9d7d553fa74c643eb2a877d"
        );
    });

    it("verifies a matching hash", () => {
        const hash = sha256FromBuffer(buffer);

        expect(
            verifySha256(buffer, hash)
        ).toBe(true);
    });

    it("rejects a modified file", () => {
        const hash = sha256FromBuffer(buffer);
        const modified = Buffer.from("CareLink Ledger!");

        expect(
            verifySha256(modified, hash)
        ).toBe(false);
    });

    it("rejects an incorrect hash", () => {
        expect(
            verifySha256(buffer, "invalid-hash")
        ).toBe(false);
    });
});
