import { CardTransaction } from "../infra/database/entities/card-transaction.entity";
import { ICardTransactionRepository } from "../contracts/card-transaction-repository.interface";
import { IExpenseCategoryRepository } from "../contracts/expense-category-repository.interface";
import { ICacheProvider } from "../contracts/cache-provider.interface";
import { CreateCardTransactionDto } from "../dtos/card-transaction/create-card-transaction.dto";
import { UpdateCardTransactionDto } from "../dtos/card-transaction/update-card-transaction.dto";
import { NotFoundError } from "../errors/not-found.error";
import { BadRequestError } from "../errors/bad-request.error";

export class CardTransactionService {

    constructor(
        private readonly transactionRepository: ICardTransactionRepository,
        private readonly cacheProvider: ICacheProvider,
        private readonly expenseCategoryRepository: IExpenseCategoryRepository,
    ) {}

    async findAll(userId: string, statementId: string): Promise<CardTransaction[]> {
        const cacheKey = `card_transactions:${statementId}:all`;
        const cached = await this.cacheProvider.get(cacheKey);

        if (cached) return JSON.parse(cached);

        const transactions = await this.transactionRepository.findAll(userId, statementId);

        await this.cacheProvider.set(cacheKey, JSON.stringify(transactions), 120);

        return transactions;
    }

    async findById(id: string, userId: string): Promise<CardTransaction> {
        const cacheKey = `card_transactions:${id}`;
        const cached = await this.cacheProvider.get(cacheKey);

        if (cached) return JSON.parse(cached);

        const transaction = await this.transactionRepository.findByIdAndUserId(id, userId);

        if (!transaction) {
            throw new NotFoundError({ message: 'Card transaction not found' });
        }

        await this.cacheProvider.set(cacheKey, JSON.stringify(transaction), 120);

        return transaction;
    }

    async create(userId: string, statementId: string, data: CreateCardTransactionDto): Promise<CardTransaction> {
        const category = await this.expenseCategoryRepository.findByIdAndUserId(data.expense_category_id, userId);

        if (!category) {
            throw new NotFoundError({ message: 'Expense category not found' });
        }

        const transaction = await this.transactionRepository.create(data, userId, statementId);

        await this.cacheProvider.del(`card_transactions:${statementId}:all`);

        return transaction;
    }

    async update(id: string, userId: string, data: UpdateCardTransactionDto): Promise<CardTransaction> {
        const transaction = await this.transactionRepository.findByIdAndUserId(id, userId);

        if (!transaction) {
            throw new NotFoundError({ message: 'Card transaction not found' });
        }

        if (data.expense_category_id) {
            const category = await this.expenseCategoryRepository.findByIdAndUserId(data.expense_category_id, userId);

            if (!category) {
                throw new NotFoundError({ message: 'Expense category not found' });
            }
        }

        const hasData = Object.values(data).some((v) => v !== undefined);

        if (!hasData) {
            throw new BadRequestError({
                message: 'No data provided for update',
                errors: { required: 'provide at least one field to update' },
            });
        }

        const updated = await this.transactionRepository.update(id, data);

        if (!updated) {
            throw new NotFoundError({ message: 'Card transaction not found' });
        }

        this.cacheProvider.del(`card_transactions:${id}`);
        this.cacheProvider.del(`card_transactions:${transaction.card_statement_id}:all`);

        return updated;
    }

    async delete(id: string, userId: string): Promise<void> {
        const transaction = await this.transactionRepository.findByIdAndUserId(id, userId);

        if (!transaction) {
            throw new NotFoundError({ message: 'Card transaction not found' });
        }

        await this.transactionRepository.delete(id);

        await this.cacheProvider.del(`card_transactions:${id}`);
        await this.cacheProvider.del(`card_transactions:${transaction.card_statement_id}:all`);
    }

}
