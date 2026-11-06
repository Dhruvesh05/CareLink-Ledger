import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

jest.unstable_mockModule("../../config/env", () => ({
    env: {
        JWT_SECRET: "test-jwt-secret-for-auth-tests",
    },
}));

const { generateToken, verifyToken } =
    await import("../../utils/jwt");
const { authenticate } =
    await import("../../middleware/auth");
import UserModel from "../../models/User";

const JWT_SECRET = "test-jwt-secret-for-auth-tests";

const payload = {
    userId: "user-123",
    walletAddress: "0xC8245E149A63A6605CFdC05425073A532dB8e3a5",
    role: "Doctor" as const,
};

function createResponseMock() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function activeUserQuery(result: unknown) {
    return {
        select: () => ({
            lean: () => ({
                exec: jest.fn().mockResolvedValue(result)
            })
        })
    };
}

describe("JWT authentication", () => {
    it("generates and verifies a valid JWT", () => {
        const token = generateToken(payload);
        expect(verifyToken(token)).toEqual(payload);
    });

    it("rejects a tampered JWT", () => {
        const token = generateToken(payload);
        expect(() => verifyToken(`${token}tampered`)).toThrow();
    });

    it("rejects a JWT signed with the wrong secret", () => {
        const token = jwt.sign(payload, "wrong-secret", { expiresIn: "1d" });
        expect(() => verifyToken(token)).toThrow();
    });

    it("rejects a JWT with an invalid role", () => {
        const token = jwt.sign(
            { ...payload, role: "UnknownRole" },
            JWT_SECRET,
            { expiresIn: "1d" }
        );
        expect(() => verifyToken(token)).toThrow("Invalid JWT role");
    });
});

describe("authenticate middleware", () => {
    let next: jest.Mock;

    beforeEach(() => {
        next = jest.fn();
        jest.spyOn(UserModel, "findOne").mockReturnValue(
            activeUserQuery({
                _id: payload.userId,
                walletAddress: payload.walletAddress,
                role: payload.role
            }) as never
        );
    });

    it("rejects a request without authorization", async () => {
        const res = createResponseMock();
        await authenticate({ headers: {} } as Request, res, next as unknown as NextFunction);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Authentication required",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects a malformed authorization header", async () => {
        const res = createResponseMock();
        await authenticate({
            headers: { authorization: "Basic abc123" }
        } as Request, res, next as unknown as NextFunction);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid authorization header",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects an invalid JWT", async () => {
        const res = createResponseMock();
        await authenticate({
            headers: { authorization: "Bearer invalid" }
        } as Request, res, next as unknown as NextFunction);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid or expired token",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("accepts a valid JWT and attaches authentication data", async () => {
        const token = generateToken(payload);
        const req = {
            headers: { authorization: "Bearer " + token }
        } as Request;
        const res = createResponseMock();

        await authenticate(req, res, next as unknown as NextFunction);

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.auth).toEqual(payload);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("rejects a token for an inactive or changed account", async () => {
        jest.spyOn(UserModel, "findOne").mockReturnValue(
            activeUserQuery(null) as never
        );
        const token = generateToken(payload);
        const res = createResponseMock();

        await authenticate({
            headers: { authorization: "Bearer " + token }
        } as Request, res, next as unknown as NextFunction);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid or inactive account"
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("accepts a legacy user without active because the schema default is true", async () => {
        const legacyUser = new UserModel({
            walletAddress: payload.walletAddress,
            role: payload.role
        });
        expect(legacyUser.active).toBe(true);

        const token = generateToken(payload);
        const res = createResponseMock();
        await authenticate({
            headers: { authorization: "Bearer " + token }
        } as Request, res, next as unknown as NextFunction);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});
