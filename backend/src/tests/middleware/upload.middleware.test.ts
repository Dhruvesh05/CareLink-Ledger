import {
    describe,
    expect,
    it,
    jest
} from "@jest/globals";

import {
    storage,
    upload
} from "../../middleware/upload.middleware";

describe("Medical record upload middleware", () => {

    it("uses memory storage", () => {

        expect(storage).toBeDefined();

        expect(
            (storage as any)._handleFile
        ).toBeDefined();

        expect(
            (storage as any)._removeFile
        ).toBeDefined();
    });

    it("accepts PDF", () => {

        const file = {
            mimetype: "application/pdf"
        } as Express.Multer.File;

        const callback =
            jest.fn() as jest.Mock;

        const filter =
            (upload as any).fileFilter;

        filter({}, file, callback);

        expect(callback).toHaveBeenCalledWith(
            null,
            true
        );
    });

    it("accepts JPEG", () => {

        const file = {
            mimetype: "image/jpeg"
        } as Express.Multer.File;

        const callback =
            jest.fn() as jest.Mock;

        const filter =
            (upload as any).fileFilter;

        filter({}, file, callback);

        expect(callback).toHaveBeenCalledWith(
            null,
            true
        );
    });

    it("accepts PNG", () => {

        const file = {
            mimetype: "image/png"
        } as Express.Multer.File;

        const callback =
            jest.fn() as jest.Mock;

        const filter =
            (upload as any).fileFilter;

        filter({}, file, callback);

        expect(callback).toHaveBeenCalledWith(
            null,
            true
        );
    });

    it("accepts DICOM", () => {

        const file = {
            mimetype: "application/dicom"
        } as Express.Multer.File;

        const callback =
            jest.fn() as jest.Mock;

        const filter =
            (upload as any).fileFilter;

        filter({}, file, callback);

        expect(callback).toHaveBeenCalledWith(
            null,
            true
        );
    });

    it("rejects unsupported MIME types", () => {

        const file = {
            mimetype: "text/plain"
        } as Express.Multer.File;

        const callback =
            jest.fn() as jest.Mock;

        const filter =
            (upload as any).fileFilter;

        filter({}, file, callback);

        expect(callback).toHaveBeenCalledWith(
            expect.any(Error)
        );

        const error =
            callback.mock.calls[0][0] as Error;

        expect(error.message).toBe(
            "Unsupported file type"
        );
    });

    it("rejects missing MIME type", () => {

        const file = {} as Express.Multer.File;

        const callback =
            jest.fn() as jest.Mock;

        const filter =
            (upload as any).fileFilter;

        filter({}, file, callback);

        expect(callback).toHaveBeenCalledWith(
            expect.any(Error)
        );

        const error =
            callback.mock.calls[0][0] as Error;

        expect(error.message).toBe(
            "Missing file or mime type"
        );
    });

    it("is configured with a 50 MB file-size limit", () => {

        const limits =
            (upload as any).limits;

        expect(
            limits.fileSize
        ).toBe(
            50 * 1024 * 1024
        );
    });
});
