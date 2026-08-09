import crypto from "crypto";

export function sha256FromBuffer(buffer: Buffer): string {
    const hash = crypto.createHash("sha256");
    hash.update(buffer);
    return hash.digest("hex");
}

export default sha256FromBuffer;
