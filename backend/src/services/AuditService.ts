import { IBlockchainProvider } from "../blockchain/provider/IBlockchainProvider";

export class AuditService {

    private readonly blockchainService: IBlockchainProvider;

    constructor(
        blockchainService: IBlockchainProvider
    ) {
        this.blockchainService = blockchainService;
    }

    async getAudit(
        logId: number
    ) {
        return await this.blockchainService.getAudit(
            logId
        );
    }

    async getRecordAuditLogs(
        recordId: number
    ) {
        return await this.blockchainService.getRecordAuditLogs(
            recordId
        );
    }

    async totalAuditLogs() {
        return await this.blockchainService.totalAuditLogs();
    }
}
