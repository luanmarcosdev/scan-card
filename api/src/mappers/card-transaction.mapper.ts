import { CardTransaction } from "../infra/database/entities/card-transaction.entity";
import { CardTransactionResponseDto } from "../dtos/card-transaction/response-card-transaction.dto";

export function cardTransactionToResponseDto(transaction: CardTransaction): CardTransactionResponseDto {
    return {
        id: transaction.id,
        card_statement_id: transaction.card_statement_id,
        expense_category_id: transaction.expense_category_id,
        merchant: transaction.merchant,
        transaction_date: transaction.transaction_date,
        parcels: transaction.parcels,
        current_parcel: transaction.current_parcel,
        parcel_value: transaction.parcel_value,
        total_value: transaction.total_value,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
    };
}
