import { AuditContract } from "../contracts/AuditContract";


export class EthereumAuditService {

    private auditContract: AuditContract;


    constructor() {

        this.auditContract =
            new AuditContract();

    }


    async getAudit(
        logId: number
    ) {

        return await this.auditContract.getAudit(
            logId
        );

    }


    async getRecordAuditLogs(
        recordId: number
    ) {

        return await this.auditContract.getRecordAuditLogs(
            recordId
        );

    }


    async totalAuditLogs() {

        return await this.auditContract.totalAuditLogs();

    }

}