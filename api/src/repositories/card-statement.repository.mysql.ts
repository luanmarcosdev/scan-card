import { AppDataSource } from "../infra/database/data-source";
import { CardStatement } from "../infra/database/entities/card-statement.entity";
import { ICardStatementRepository } from "../contracts/card-statement-repository.interface";
import { CreateCardStatementDto } from "../dtos/card-statement/create-card-statement.dto";
import { UpdateCardStatementDto } from "../dtos/card-statement/update-card-statement.dto";
import { NotFoundError } from "../errors/not-found.error";

export class CardStatementRepositoryMySQL implements ICardStatementRepository {

    private repo = AppDataSource.getRepository(CardStatement);

    async findAll(userId: string, cardId: string): Promise<CardStatement[]> {
        return this.repo.find({ where: { user_id: userId, card_id: cardId }, order: { created_at: 'DESC' } });
    }

    async findById(id: string): Promise<CardStatement | null> {
        return this.repo.findOneBy({ id });
    }

    async findByIdAndUserId(id: string, userId: string): Promise<CardStatement | null> {
        return this.repo.findOneBy({ id, user_id: userId });
    }

    async create(data: CreateCardStatementDto, userId: string, cardId: string): Promise<CardStatement> {
        return this.repo.save({ ...data, user_id: userId, card_id: cardId });
    }

    async update(id: string, data: UpdateCardStatementDto): Promise<CardStatement | null> {
        const result = await this.repo.update({ id }, data);

        if (result.affected === 0) {
            throw new NotFoundError({ message: 'Card statement not found' });
        }

        return this.findById(id);
    }

    async updateStatus(id: string, statusId: number): Promise<void> {
        await this.repo.update({ id }, { status_id: statusId });
    }

    async delete(id: string): Promise<void> {
        const result = await this.repo.softDelete(id);

        if (result.affected === 0) {
            throw new NotFoundError({ message: 'Card statement not found' });
        }
    }

}
