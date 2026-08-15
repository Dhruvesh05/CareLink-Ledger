import {
    IPFSService,
    IPFSUploadResult
} from "../../services/ipfs/IPFSService";

import { StorageService } from "../services/StorageService";

export class IPFSServiceAdapter
    implements IPFSService {

    private readonly storageService: StorageService;

    constructor(
        storageService: StorageService =
            new StorageService()
    ) {
        this.storageService =
            storageService;
    }

    async uploadFile(
        file: Buffer,
        fileName: string,
        mimeType: string
    ): Promise<IPFSUploadResult> {

        const result =
            await this.storageService.store({
                content: file,
                fileName,
                mimeType
            });

        return {
            cid: result.upload.cid,
            size: result.upload.size,
            fileName: result.metadata.fileName,
            mimeType: result.metadata.mimeType,
            gatewayUrl:
                result.upload.gatewayUrl
        };
    }
}

export default IPFSServiceAdapter;