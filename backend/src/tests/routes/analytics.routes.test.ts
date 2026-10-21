import {
    describe,
    expect,
    it
} from "@jest/globals";

import { authenticate, requireRole } from "../../middleware/auth";

describe("Analytics route", () => {
    it("exposes a separate authenticated tabular upload route", async () => {
        const { default: router } = await import("../../routes/analytics.routes");
        const routeLayer = router.stack.find(
            (layer: any) => layer.route?.path === "/analyze"
        );

        const route = routeLayer?.route as any;

        expect(route?.methods.post).toBe(true);
        expect(route?.stack).toHaveLength(6);
        expect(route?.stack[0].handle).toBe(authenticate);
        expect(route?.stack[1].handle).toEqual(expect.any(Function));
        expect(route?.stack[2].handle).toEqual(expect.any(Function));
    });

    it("does not authorize patients for dataset ingestion", () => {
        const middleware = requireRole("Admin", "Doctor", "Hospital");
        const res: any = {
            status: (status: number) => ({
                json: (body: unknown) => ({ status, body })
            })
        };
        let nextCalled = false;

        const result = middleware(
            { auth: { role: "Patient" } } as any,
            res,
            () => {
                nextCalled = true;
            }
        );

        expect(nextCalled).toBe(false);
        expect(result).toEqual({
            status: 403,
            body: {
                success: false,
                message: "Insufficient role for this operation"
            }
        });
    });
});
