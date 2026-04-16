import { ExpenseCategory } from "../infra/database/entities/expense-category.entity";
import { IExpenseCategoryRepository } from "../contracts/expense-category-repository.interface";
import { ICacheProvider } from "../contracts/cache-provider.interface";
import { CreateExpenseCategoryDto } from "../dtos/expense-category/create-expense-category.dto";
import { UpdateExpenseCategoryDto } from "../dtos/expense-category/update-expense-category.dto";
import { NotFoundError } from "../errors/not-found.error";
import { ConflictError } from "../errors/conflict.error";
import { BadRequestError } from "../errors/bad-request.error";

const DEFAULT_CATEGORIES = [
    'Alimentacao',
    'Transporte',
    'Saude',
    'Lazer',
    'Educacao',
    'Moradia',
    'Outros',
];

export class ExpenseCategoryService {

    constructor(
        private readonly categoryRepository: IExpenseCategoryRepository,
        private readonly cacheProvider: ICacheProvider,
    ) {}

    async findAll(userId: string): Promise<ExpenseCategory[]> {
        const cacheKey = `expense_categories:${userId}:all`;
        const cached = await this.cacheProvider.get(cacheKey);

        if (cached) return JSON.parse(cached);

        const categories = await this.categoryRepository.findAll(userId);

        await this.cacheProvider.set(cacheKey, JSON.stringify(categories), 120);

        return categories;
    }

    async findById(id: string, userId: string): Promise<ExpenseCategory> {
        const cacheKey = `expense_categories:${id}`;
        const cached = await this.cacheProvider.get(cacheKey);

        if (cached) return JSON.parse(cached);

        const category = await this.categoryRepository.findByIdAndUserId(id, userId);

        if (!category) {
            throw new NotFoundError({ message: 'Expense category not found' });
        }

        await this.cacheProvider.set(cacheKey, JSON.stringify(category), 120);

        return category;
    }

    async create(userId: string, data: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
        const category = await this.categoryRepository.create(data, userId);

        await this.cacheProvider.del(`expense_categories:${userId}:all`);

        return category;
    }

    async createDefaults(userId: string): Promise<void> {
        const categories = DEFAULT_CATEGORIES.map(category => ({ category, user_id: userId }));
        await this.categoryRepository.createMany(categories);
    }

    async update(id: string, userId: string, data: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
        const category = await this.categoryRepository.findByIdAndUserId(id, userId);

        if (!category) {
            throw new NotFoundError({ message: 'Expense category not found' });
        }

        if (data.category === undefined && data.description === undefined) {
            throw new BadRequestError({
                message: 'No data provided for update',
                errors: { required: 'provide at least one of: category, description' },
            });
        }

        const updated = await this.categoryRepository.update(id, data);

        if (!updated) {
            throw new NotFoundError({ message: 'Expense category not found' });
        }

        this.cacheProvider.del(`expense_categories:${id}`);
        this.cacheProvider.del(`expense_categories:${userId}:all`);

        return updated;
    }

    async delete(id: string, userId: string): Promise<void> {
        const category = await this.categoryRepository.findByIdAndUserId(id, userId);

        if (!category) {
            throw new NotFoundError({ message: 'Expense category not found' });
        }

        const inUse = await this.categoryRepository.isInUse(id);

        if (inUse) {
            throw new ConflictError({ message: 'Expense category is in use and cannot be deleted' });
        }

        await this.categoryRepository.delete(id);
        await this.cacheProvider.del(`expense_categories:${id}`);
        await this.cacheProvider.del(`expense_categories:${userId}:all`);
    }

}
