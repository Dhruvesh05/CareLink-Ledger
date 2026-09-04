import jwt, {
    JwtPayload,
    SignOptions
} from "jsonwebtoken";

import { env } from "../config/env";

export interface AuthTokenPayload {
    userId: string;
    walletAddress: string;
    role: "Admin" | "Patient" | "Doctor" | "Hospital";
}

const JWT_EXPIRES_IN = "1d";

function getJwtSecret(): string {
    if (!env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET is not configured"
        );
    }

    return env.JWT_SECRET;
}

export function generateToken(
    payload: AuthTokenPayload
): string {
    const options: SignOptions = {
        expiresIn: JWT_EXPIRES_IN
    };

    return jwt.sign(
        payload,
        getJwtSecret(),
        options
    );
}

export function verifyToken(
    token: string
): AuthTokenPayload {
    const decoded = jwt.verify(
        token,
        getJwtSecret()
    );

    if (
        typeof decoded !== "object" ||
        decoded === null
    ) {
        throw new Error("Invalid JWT payload");
    }

    const payload = decoded as JwtPayload & Partial<AuthTokenPayload>;

    if (
        typeof payload.userId !== "string" ||
        typeof payload.walletAddress !== "string" ||
        typeof payload.role !== "string"
    ) {
        throw new Error("Invalid JWT payload");
    }

    if (
        payload.role !== "Admin" &&
        payload.role !== "Patient" &&
        payload.role !== "Doctor" &&
        payload.role !== "Hospital"
    ) {
        throw new Error("Invalid JWT role");
    }

    return {
        userId: payload.userId,
        walletAddress: payload.walletAddress,
        role: payload.role
    };
}
