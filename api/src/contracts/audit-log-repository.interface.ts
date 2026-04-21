import { AuditLog } from "../infra/database/entities/audit-log.entity";

export interface IAuditLogRepository {
    create(data: Partial<AuditLog>): Promise<AuditLog>;
    findByStatementId(statementId: string): Promise<AuditLog[]>;
}
