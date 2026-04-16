import { ExpenseCategory } from "../infra/database/entities/expense-category.entity";
import { ExpenseCategoryResponseDto } from "../dtos/expense-category/response-expense-category.dto";

export function expenseCategoryToResponseDto(category: ExpenseCategory): ExpenseCategoryResponseDto {
    return {
        id: category.id,
        category: category.category,
        description: category.description,
        created_at: category.created_at,
        updated_at: category.updated_at,
        deleted_at: category.deleted_at,
    };
}
