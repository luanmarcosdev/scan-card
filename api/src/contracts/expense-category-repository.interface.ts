import { ExpenseCategory } from "../infra/database/entities/expense-category.entity";
import { CreateExpenseCategoryDto } from "../dtos/expense-category/create-expense-category.dto";
import { UpdateExpenseCategoryDto } from "../dtos/expense-category/update-expense-category.dto";

export interface IExpenseCategoryRepository {
    findAll(userId: string): Promise<ExpenseCategory[]>;
    findById(id: string): Promise<ExpenseCategory | null>;
    findByIdAndUserId(id: string, userId: string): Promise<ExpenseCategory | null>;
    create(data: CreateExpenseCategoryDto, userId: string): Promise<ExpenseCategory>;
    createMany(categories: Array<{ category: string; user_id: string }>): Promise<void>;
    update(id: string, data: UpdateExpenseCategoryDto): Promise<ExpenseCategory | null>;
    delete(id: string): Promise<void>;
    isInUse(id: string): Promise<boolean>;
}
