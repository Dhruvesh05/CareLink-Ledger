export interface IFileMetadata {
    readonly cid: string;
    readonly fileName: string;
    readonly mimeType: string;
    readonly fileSize: number;
    readonly uploadedAt: string;
}