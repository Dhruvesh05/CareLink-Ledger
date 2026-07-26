import { EthereumAuditService } from "../blockchain/ethereum/services/EthereumAuditService";


export class AuditService {

    private blockchainService: EthereumAuditService;

    constructor() {

        this.blockchainService =
            new EthereumAuditService();

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