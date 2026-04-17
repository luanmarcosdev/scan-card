import { CardStatement } from "../infra/database/entities/card-statement.entity";
import { CreateCardStatementDto } from "../dtos/card-statement/create-card-statement.dto";
import { UpdateCardStatementDto } from "../dtos/card-statement/update-card-statement.dto";

export interface ICardStatementRepository {
    findAll(userId: string): Promise<CardStatement[]>;
    findById(id: string): Promise<CardStatement | null>;
    findByIdAndUserId(id: string, userId: string): Promise<CardStatement | null>;
    create(data: CreateCardStatementDto, userId: string): Promise<CardStatement>;
    update(id: string, data: UpdateCardStatementDto): Promise<CardStatement | null>;
    updateStatus(id: string, statusId: number): Promise<void>;
    delete(id: string): Promise<void>;
}
