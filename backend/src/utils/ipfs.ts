export function normalizeCid(
    value: unknown
): string {

    if (typeof value !== "string") {
        throw new Error("CID must be a string");
    }

    const cid = value.trim();

    if (!cid) {
        throw new Error("CID is required");
    }

    if (/\s/.test(cid)) {
        throw new Error(
            "CID must not contain whitespace"
        );
    }

    /*
     * CIDv0:
     *   Qm...
     *
     * CIDv1:
     *   baf...
     *
     * Multibase CIDs are generally alphanumeric.
     */
    if (!/^[A-Za-z0-9]+$/.test(cid)) {
        throw new Error(
            "Invalid CID format"
        );
    }

    return cid;
}

export function isValidCid(
    value: unknown
): value is string {

    try {

        normalizeCid(value);

        return true;

    } catch {

        return false;
    }
}

export function buildIpfsUri(
    cid: string
): string {

    return `ipfs://${normalizeCid(cid)}`;
}