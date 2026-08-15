import { describe, expect, it, jest } from "@jest/globals";
import { AuthController } from "../../controllers/AuthController";

function createResponseMock() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("AuthController", () => {
    it("returns module status", () => {
        const controller = new AuthController();
        const res = createResponseMock();

        controller.status({} as any, res as any);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Auth module available",
            data: {
                module: "auth",
                implemented: false
            }
        });
    });
});