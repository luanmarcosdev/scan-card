import { AppDataSource } from "../infra/database/data-source";
import { CardTransaction } from "../infra/database/entities/card-transaction.entity";
import { ICardTransactionRepository } from "../contracts/card-transaction-repository.interface";
import { CreateCardTransactionDto } from "../dtos/card-transaction/create-card-transaction.dto";
import { UpdateCardTransactionDto } from "../dtos/card-transaction/update-card-transaction.dto";
import { NotFoundError } from "../errors/not-found.error";

export class CardTransactionRepositoryMySQL implements ICardTransactionRepository {

    private repo = AppDataSource.getRepository(CardTransaction);

    async findAll(userId: string, statementId: string): Promise<CardTransaction[]> {
        return this.repo.find({ where: { user_id: userId, card_statement_id: statementId }, order: { created_at: 'DESC' } });
    }

    async findById(id: string): Promise<CardTransaction | null> {
        return this.repo.findOneBy({ id });
    }

    async findByIdAndUserId(id: string, userId: string): Promise<CardTransaction | null> {
        return this.repo.findOneBy({ id, user_id: userId });
    }

    async create(data: CreateCardTransactionDto, userId: string, statementId: string): Promise<CardTransaction> {
        return this.repo.save({ ...data, user_id: userId, card_statement_id: statementId });
    }

    async update(id: string, data: UpdateCardTransactionDto): Promise<CardTransaction | null> {
        const result = await this.repo.update({ id }, data);

        if (result.affected === 0) {
            throw new NotFoundError({ message: 'Card transaction not found' });
        }

        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        const result = await this.repo.softDelete(id);

        if (result.affected === 0) {
            throw new NotFoundError({ message: 'Card transaction not found' });
        }
    }

}
