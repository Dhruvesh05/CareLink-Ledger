export interface IPFSUploadResult {
    cid: string;
    size: number;
    mimeType: string;
    fileName: string;
    gatewayUrl?: string;
}

export interface IPFSService {
    uploadFile(
        file: Buffer,
        fileName: string,
        mimeType: string
    ): Promise<IPFSUploadResult>;
}