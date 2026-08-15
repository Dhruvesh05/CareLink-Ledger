import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../config/database", () => ({
    getDatabaseHealth: jest.fn()
}));

import { HealthController } from "../../controllers/HealthController";
import { getDatabaseHealth } from "../../config/database";

function createResponseMock() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("HealthController", () => {
    it("returns liveness response", () => {
        const controller = new HealthController();
        const res = createResponseMock();

        controller.liveness({} as any, res as any);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Service is alive"
            })
        );
    });

    it("returns 503 when readiness check fails", () => {
        (getDatabaseHealth as jest.Mock).mockReturnValue({
            readyState: 0,
            status: "disconnected"
        });

        const controller = new HealthController();
        const res = createResponseMock();

        controller.readiness({} as any, res as any);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: "Service is not ready"
            })
        );
    });
});