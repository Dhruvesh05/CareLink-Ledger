import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

describe("MetadataService", () => {
	let MetadataService: typeof import("../services/MetadataService").MetadataService;
	let InvalidMetadataInputError: typeof import("../services/MetadataService").InvalidMetadataInputError;

	beforeEach(async () => {
		jest.resetModules();
		jest.useFakeTimers();
		jest.setSystemTime(new Date("2025-01-15T10:00:00.000Z"));

		const module = await import("../services/MetadataService");
		MetadataService = module.MetadataService;
		InvalidMetadataInputError = module.InvalidMetadataInputError;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("generates normalized metadata with the current timestamp when none is provided", () => {
		const service = new MetadataService();

		const result = service.generateMetadata({
			cid: "  bafy-metadata-cid  ",
			fileName: "  record.pdf  ",
			mimeType: "  application/pdf  ",
			fileSize: 1024
		});

		expect(result).toEqual({
			cid: "bafy-metadata-cid",
			fileName: "record.pdf",
			mimeType: "application/pdf",
			fileSize: 1024,
			uploadedAt: "2025-01-15T10:00:00.000Z"
		});
	});

	it("preserves a supplied Date timestamp as ISO string", () => {
		const service = new MetadataService();

		const result = service.generateMetadata({
			cid: "bafy-date-cid",
			fileName: "report.txt",
			mimeType: "text/plain",
			fileSize: 256,
			uploadedAt: new Date("2024-03-01T12:30:45.000Z")
		});

		expect(result.uploadedAt).toBe("2024-03-01T12:30:45.000Z");
	});

	it("preserves a supplied timestamp string as ISO string", () => {
		const service = new MetadataService();

		const result = service.generateMetadata({
			cid: "bafy-string-cid",
			fileName: "report.json",
			mimeType: "application/json",
			fileSize: 64,
			uploadedAt: "2024-06-10T08:15:00.000Z"
		});

		expect(result.uploadedAt).toBe("2024-06-10T08:15:00.000Z");
	});

	it("rejects missing CID input", () => {
		const service = new MetadataService();

		expect(() =>
			service.generateMetadata({
				cid: "",
				fileName: "record.pdf",
				mimeType: "application/pdf",
				fileSize: 1
			})
		).toThrow(InvalidMetadataInputError);
	});

	it("rejects invalid file size input", () => {
		const service = new MetadataService();

		expect(() =>
			service.generateMetadata({
				cid: "bafy-invalid-size",
				fileName: "record.pdf",
				mimeType: "application/pdf",
				fileSize: -1
			})
		).toThrow(InvalidMetadataInputError);
	});

	it("rejects invalid uploaded timestamp strings", () => {
		const service = new MetadataService();

		expect(() =>
			service.generateMetadata({
				cid: "bafy-invalid-time",
				fileName: "record.pdf",
				mimeType: "application/pdf",
				fileSize: 1,
				uploadedAt: "not-a-date"
			})
		).toThrow(InvalidMetadataInputError);
	});
});