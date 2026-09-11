import crypto from "crypto";

export function sha256FromBuffer(buffer: Buffer): string {
    const hash = crypto.createHash("sha256");
    hash.update(buffer);
    return hash.digest("hex");
}

export function verifySha256(
    buffer: Buffer,
    expectedHash: string
): boolean {
    return sha256FromBuffer(buffer) === expectedHash;
}

export default sha256FromBuffer;
