export class CardStatementResponseDto {
    id!: string;
    card_id!: string;
    status_id!: number;
    year_reference!: number;
    month_reference!: number;
    total!: number | null;
    created_at!: Date;
    updated_at!: Date | null;
}
