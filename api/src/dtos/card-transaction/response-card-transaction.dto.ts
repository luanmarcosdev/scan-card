export class CardTransactionResponseDto {
    id!: string;
    card_statement_id!: string;
    expense_category_id!: string;
    merchant!: string | null;
    transaction_date!: Date | null;
    parcels!: number;
    current_parcel!: number;
    parcel_value!: number | null;
    total_value!: number;
    created_at!: Date;
    updated_at!: Date | null;
}
