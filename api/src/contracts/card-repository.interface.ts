import { Card } from "../infra/database/entities/card.entity";
import { CreateCardDto } from "../dtos/card/create-card.dto";
import { UpdateCardDto } from "../dtos/card/update-card.dto";

export interface ICardRepository {
    findAll(userId: string): Promise<Card[]>;
    findById(id: string): Promise<Card | null>;
    findByIdAndUserId(id: string, userId: string): Promise<Card | null>;
    create(data: CreateCardDto, userId: string): Promise<Card>;
    update(id: string, data: UpdateCardDto): Promise<Card | null>;
    delete(id: string): Promise<void>;
    isInUse(id: string): Promise<boolean>;
}
