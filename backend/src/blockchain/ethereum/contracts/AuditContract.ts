import { ethereum } from "../config/ethereum";


export class AuditContract {


    async getAudit(
        logId: number
    ) {


        return await ethereum.auditLog.getAudit(
            logId
        );

    }





    async getRecordAuditLogs(
        recordId: number
    ) {


        return await ethereum.auditLog.getRecordAuditLogs(
            recordId
        );

    }





    async totalAuditLogs() {


        return await ethereum.auditLog.totalAuditLogs();

    }



}