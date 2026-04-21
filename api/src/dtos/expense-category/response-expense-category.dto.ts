export class ExpenseCategoryResponseDto {
    id!: string;
    category!: string;
    description!: string | null;
    created_at!: Date;
    updated_at!: Date | null;
}
