import { IPFSService, IPFSUploadResult } from "../../services/ipfs/IPFSService";
import { StorageService, IStorageResult } from "../services/StorageService";
import type { IStorageOptions } from "../interfaces/IStorageOptions";

export class IPFSServiceAdapter implements IPFSService {
    private readonly storage: StorageService;

    constructor(storageService: StorageService = new StorageService()) {
        this.storage = storageService;
    }

    async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<IPFSUploadResult> {
        const input: IStorageOptions = {
            content: file,
            fileName,
            mimeType,
            uploadedAt: new Date()
        };

        const result: IStorageResult = await this.storage.store(input);

        return {
            cid: result.upload.cid,
            size: result.upload.size,
            mimeType: mimeType,
            fileName: fileName
        };
    }

}

export default IPFSServiceAdapter;
