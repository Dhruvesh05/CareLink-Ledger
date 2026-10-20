import {
    describe,
    expect,
    it,
    jest
} from "@jest/globals";

import {
    analyticsUpload,
    requireAnalyticsFile
} from "./analyticsUpload.middleware";

describe("Analytics upload middleware", () => {
    it.each(["patients.csv", "patients.xlsx", "patients.xls", "patients.json"])(
        "accepts %s",
        (originalname) => {
            const callback = jest.fn() as jest.Mock;
            const filter = (analyticsUpload as any).fileFilter;

            filter({}, { originalname } as Express.Multer.File, callback);

            expect(callback).toHaveBeenCalledWith(null, true);
        }
    );

    it("rejects clinical-document extensions", () => {
        const callback = jest.fn() as jest.Mock;
        const filter = (analyticsUpload as any).fileFilter;

        filter({}, { originalname: "record.pdf" } as Express.Multer.File, callback);

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect((callback.mock.calls[0][0] as Error).message).toBe(
            "Analytics upload must be CSV, XLSX, XLS, or JSON"
        );
    });

    it("uses an explicit 10 MiB default size limit", () => {
        expect((analyticsUpload as any).limits.fileSize).toBe(10 * 1024 * 1024);
    });

    it("rejects an empty in-memory upload", () => {
        const res: any = {
            status: jest.fn(),
            json: jest.fn()
        };
        res.status.mockReturnValue(res);

        requireAnalyticsFile(
            { file: { buffer: Buffer.alloc(0) } } as any,
            res,
            jest.fn()
        );

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Uploaded file must not be empty"
        });
    });
});
