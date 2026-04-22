import { Job } from "../infra/database/entities/job.entity";

export interface IJobRepository {
    create(data: Partial<Job>): Promise<Job>;
    findById(id: string): Promise<Job | null>;
    findByStatementId(statementId: string): Promise<Job | null>;
    updateStatus(id: string, statusId: number): Promise<void>;
    updateStatusByStatementId(statementId: string, statusId: number): Promise<void>;
    incrementRetries(id: string): Promise<void>;
}
