import { AppDataSource } from "../infra/database/data-source";
import { FailJob } from "../infra/database/entities/fail-job.entity";
import { IFailJobRepository } from "../contracts/fail-job-repository.interface";

export class FailJobRepositoryMySQL implements IFailJobRepository {

    private repo = AppDataSource.getRepository(FailJob);

    async create(data: Partial<FailJob>): Promise<FailJob> {
        return this.repo.save(data);
    }

    async findAllActive(): Promise<FailJob[]> {
        return this.repo.findBy({ deleted_at: null as any });
    }

    async softDelete(id: string): Promise<void> {
        await this.repo.softDelete(id);
    }

}
