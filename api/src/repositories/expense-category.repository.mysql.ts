import { AppDataSource } from "../infra/database/data-source";
import { ExpenseCategory } from "../infra/database/entities/expense-category.entity";
import { IExpenseCategoryRepository } from "../contracts/expense-category-repository.interface";
import { CreateExpenseCategoryDto } from "../dtos/expense-category/create-expense-category.dto";
import { UpdateExpenseCategoryDto } from "../dtos/expense-category/update-expense-category.dto";
import { NotFoundError } from "../errors/not-found.error";

export class ExpenseCategoryRepositoryMySQL implements IExpenseCategoryRepository {

    private repo = AppDataSource.getRepository(ExpenseCategory);

    async findAll(userId: string): Promise<ExpenseCategory[]> {
        return this.repo.findBy({ user_id: userId });
    }

    async findById(id: string): Promise<ExpenseCategory | null> {
        return this.repo.findOneBy({ id });
    }

    async findByIdAndUserId(id: string, userId: string): Promise<ExpenseCategory | null> {
        return this.repo.findOneBy({ id, user_id: userId });
    }

    async create(data: CreateExpenseCategoryDto, userId: string): Promise<ExpenseCategory> {
        return this.repo.save({ ...data, user_id: userId });
    }

    async createMany(categories: Array<{ category: string; user_id: string }>): Promise<void> {
        await this.repo.save(categories);
    }

    async update(id: string, data: UpdateExpenseCategoryDto): Promise<ExpenseCategory | null> {
        const result = await this.repo.update({ id }, data);

        if (result.affected === 0) {
            throw new NotFoundError({ message: 'Expense category not found' });
        }

        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        const result = await this.repo.softDelete(id);

        if (result.affected === 0) {
            throw new NotFoundError({ message: 'Expense category not found' });
        }
    }

    async isInUse(id: string): Promise<boolean> {
        // atualizar quando expenses for criado
        return false;
    }

}
