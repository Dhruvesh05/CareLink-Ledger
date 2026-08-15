import { describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { getDatabaseHealth } from "../../config/database";

describe("database config", () => {
    it("maps readyState values", () => {
        const originalState = mongoose.connection.readyState;

        (mongoose.connection as any).readyState = 1;
        expect(getDatabaseHealth()).toEqual({ readyState: 1, status: "connected" });

        (mongoose.connection as any).readyState = 0;
        expect(getDatabaseHealth()).toEqual({ readyState: 0, status: "disconnected" });

        (mongoose.connection as any).readyState = originalState;
    });
});