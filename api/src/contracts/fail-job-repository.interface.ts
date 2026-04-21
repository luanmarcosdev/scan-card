import { FailJob } from "../infra/database/entities/fail-job.entity";

export interface IFailJobRepository {
    create(data: Partial<FailJob>): Promise<FailJob>;
    findAllActive(): Promise<FailJob[]>;
    softDelete(id: string): Promise<void>;
}
