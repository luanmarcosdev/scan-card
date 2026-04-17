import { CardStatement } from "../infra/database/entities/card-statement.entity";
import { CardStatementResponseDto } from "../dtos/card-statement/response-card-statement.dto";

export function cardStatementToResponseDto(statement: CardStatement): CardStatementResponseDto {
    return {
        id: statement.id,
        card_id: statement.card_id,
        status_id: statement.status_id,
        year_reference: statement.year_reference,
        month_reference: statement.month_reference,
        total: statement.total,
        created_at: statement.created_at,
        updated_at: statement.updated_at,
    };
}
