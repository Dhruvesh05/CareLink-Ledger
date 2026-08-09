export interface IPFSUploadResult {
    cid: string;
    size?: number;
    mimeType?: string;
    fileName?: string;
}

export interface IPFSService {
    uploadFile(
        file: Buffer,
        fileName: string,
        mimeType: string
    ): Promise<IPFSUploadResult>;
}

// A placeholder implementation that throws if used. The real implementation
// should be provided by the IPFS integrator (Palak) and should implement
// `IPFSService`.
export class NotImplementedIPFSService implements IPFSService {
    async uploadFile(): Promise<IPFSUploadResult> {
        throw new Error("IPFS service not implemented");
    }
}

export default IPFSService;
