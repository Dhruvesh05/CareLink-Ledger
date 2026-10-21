import {
    AnalyticsClient,
    AnalyticsClientError,
    type AnalyticsAnalysisResponse,
} from "./AnalyticsClient";

const SUPPORTED_ANALYTICS_EXTENSIONS = new Set([
    ".csv",
    ".xlsx",
    ".xls",
    ".json",
]);

export interface AnalyticsUpload {
    readonly buffer: Buffer;
    readonly originalname: string;
    readonly mimetype?: string;
}

export interface AnalyticsUploadClient {
    analyze(
        file: Buffer,
        fileName: string,
        mimeType?: string,
    ): Promise<AnalyticsAnalysisResponse>;
}

export class AnalyticsUploadService {
    private readonly client: AnalyticsUploadClient;

    constructor(client: AnalyticsUploadClient = new AnalyticsClient()) {
        this.client = client;
    }

    async analyzeUpload(
        upload: AnalyticsUpload,
    ): Promise<AnalyticsAnalysisResponse> {
        const fileName = upload.originalname.trim();
        const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

        if (!SUPPORTED_ANALYTICS_EXTENSIONS.has(extension)) {
            throw new AnalyticsClientError(
                "ANALYTICS_INVALID_UPLOAD",
                "Analytics upload must be CSV, XLSX, XLS, or JSON",
            );
        }

        return this.client.analyze(
            upload.buffer,
            fileName,
            upload.mimetype || "application/octet-stream",
        );
    }
}

export default AnalyticsUploadService;
