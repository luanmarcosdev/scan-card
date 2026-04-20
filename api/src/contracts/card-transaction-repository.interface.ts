import { CardTransaction } from "../infra/database/entities/card-transaction.entity";
import { CreateCardTransactionDto } from "../dtos/card-transaction/create-card-transaction.dto";
import { UpdateCardTransactionDto } from "../dtos/card-transaction/update-card-transaction.dto";

export interface ICardTransactionRepository {
    findAll(userId: string, statementId: string): Promise<CardTransaction[]>;
    findById(id: string): Promise<CardTransaction | null>;
    findByIdAndUserId(id: string, userId: string): Promise<CardTransaction | null>;
    create(data: CreateCardTransactionDto, userId: string, statementId: string): Promise<CardTransaction>;
    update(id: string, data: UpdateCardTransactionDto): Promise<CardTransaction | null>;
    delete(id: string): Promise<void>;
}
