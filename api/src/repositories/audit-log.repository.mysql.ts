import { AppDataSource } from "../infra/database/data-source";
import { AuditLog } from "../infra/database/entities/audit-log.entity";
import { IAuditLogRepository } from "../contracts/audit-log-repository.interface";

export class AuditLogRepositoryMySQL implements IAuditLogRepository {

    private repo = AppDataSource.getRepository(AuditLog);

    async create(data: Partial<AuditLog>): Promise<AuditLog> {
        return this.repo.save(data);
    }

    async findByStatementId(statementId: string): Promise<AuditLog[]> {
        return this.repo.findBy({ statement_id: statementId });
    }

}
