import { describe, expect, it, beforeEach } from "@jest/globals";
import jwt from "jsonwebtoken";

jest.mock("../../config/env", () => ({
    env: {
        JWT_SECRET: "test-jwt-secret-for-auth-tests",
    },
}));
import { Request, Response, NextFunction } from "express";

import {
    generateToken,
    verifyToken,
} from "../../utils/jwt";

import {
    authenticate,
} from "../../middleware/auth";

const JWT_SECRET = "test-jwt-secret-for-auth-tests";

process.env.JWT_SECRET = JWT_SECRET;

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

describe("JWT authentication", () => {
    it("generates and verifies a valid JWT", () => {
        const token = generateToken(payload);
        const decoded = verifyToken(token);

        expect(decoded).toEqual(payload);
    });

    it("rejects a tampered JWT", () => {
        const token = generateToken(payload);
        const tampered = `${token}tampered`;

        expect(() => verifyToken(tampered)).toThrow();
    });

    it("rejects a JWT signed with the wrong secret", () => {
        const token = jwt.sign(
            payload,
            "wrong-secret",
            { expiresIn: "1d" }
        );

        expect(() => verifyToken(token)).toThrow();
    });

    it("rejects a JWT with an invalid role", () => {
        const token = jwt.sign(
            {
                ...payload,
                role: "UnknownRole",
            },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        expect(() => verifyToken(token)).toThrow(
            "Invalid JWT role"
        );
    });
});

describe("authenticate middleware", () => {
    let next: jest.Mock;

    beforeEach(() => {
        next = jest.fn();
    });

    it("rejects a request without authorization", () => {
        const req = {
            headers: {},
        } as Request;

        const res = createResponseMock();

        authenticate(
            req,
            res,
            next as unknown as NextFunction
        );

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Authentication required",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects a malformed authorization header", () => {
        const req = {
            headers: {
                authorization: "Basic abc123",
            },
        } as Request;

        const res = createResponseMock();

        authenticate(
            req,
            res,
            next as unknown as NextFunction
        );

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid authorization header",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects an invalid JWT", () => {
        const req = {
            headers: {
                authorization: "Bearer invalid-token",
            },
        } as Request;

        const res = createResponseMock();

        authenticate(
            req,
            res,
            next as unknown as NextFunction
        );

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid or expired token",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("accepts a valid JWT and attaches authentication data", () => {
        const token = generateToken(payload);

        const req = {
            headers: {
                authorization: `Bearer ${token}`,
            },
        } as Request;

        const res = createResponseMock();

        authenticate(
            req,
            res,
            next as unknown as NextFunction
        );

        expect(next).toHaveBeenCalledTimes(1);
        expect(req.auth).toEqual(payload);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
