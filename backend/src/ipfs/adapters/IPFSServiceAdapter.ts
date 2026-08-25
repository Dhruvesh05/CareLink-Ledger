import {
    IPFSService,
    IPFSUploadResult
} from "../../services/ipfs/IPFSService";

import {
    StorageService
} from "../services/StorageService";

import {
    PinService
} from "../services/PinService";

export class IPFSServiceAdapter
    implements IPFSService {

    private readonly storageService:
        StorageService;

    private readonly pinService:
        PinService;

    constructor(
        storageService:
            StorageService =
                new StorageService(),

        pinService:
            PinService =
                new PinService()
    ) {

        this.storageService =
            storageService;

        this.pinService =
            pinService;
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

    async unpinFile(
        cid: string
    ): Promise<void> {

        await this.pinService.unpinCid(cid);
    }
}

export default IPFSServiceAdapter;