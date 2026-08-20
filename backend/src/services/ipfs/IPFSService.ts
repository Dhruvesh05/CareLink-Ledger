export interface IPFSUploadResult {
    cid: string;
    size: number;
    fileName: string;
    mimeType: string;
    gatewayUrl: string;
}

export interface IPFSService {

    uploadFile(
        file: Buffer,
        fileName: string,
        mimeType: string
    ): Promise<IPFSUploadResult>;

    unpinFile(
        cid: string
    ): Promise<void>;
}