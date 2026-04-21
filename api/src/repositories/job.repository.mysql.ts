import { AppDataSource } from "../infra/database/data-source";
import { Job } from "../infra/database/entities/job.entity";
import { IJobRepository } from "../contracts/job-repository.interface";

export class JobRepositoryMySQL implements IJobRepository {

    private repo = AppDataSource.getRepository(Job);

    async create(data: Partial<Job>): Promise<Job> {
        return this.repo.save(data);
    }

    async findById(id: string): Promise<Job | null> {
        return this.repo.findOneBy({ id });
    }

    async findByStatementId(statementId: string): Promise<Job | null> {
        return this.repo.findOneBy({ statement_id: statementId });
    }

    async updateStatus(id: string, statusId: number): Promise<void> {
        await this.repo.update({ id }, { status_id: statusId });
    }

    async incrementRetries(id: string): Promise<void> {
        await this.repo.increment({ id }, 'retries', 1);
    }

}
