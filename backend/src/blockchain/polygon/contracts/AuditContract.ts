import { polygon } from "../config/polygon";

export class AuditContract {
    private readonly contract = polygon.auditLog;

    async getAudit(logId: number) {
        return await this.contract.getAudit(logId);
    }

    async getRecordAuditLogs(recordId: number) {
        return await this.contract.getRecordAuditLogs(recordId);
    }

    async totalAuditLogs() {
        return await this.contract.totalAuditLogs();
    }
}
