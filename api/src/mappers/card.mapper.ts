import { Card } from "../infra/database/entities/card.entity";
import { CardResponseDto } from "../dtos/card/response-card.dto";

export function cardToResponseDto(card: Card): CardResponseDto {
    return {
        id: card.id,
        last_numbers: card.last_numbers,
        name: card.name,
        created_at: card.created_at,
        updated_at: card.updated_at,
        deleted_at: card.deleted_at,
    };
}
