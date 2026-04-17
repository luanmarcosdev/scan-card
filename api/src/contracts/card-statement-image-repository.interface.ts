import { CardStatementImage } from "../infra/database/entities/card-statement-image.entity";

export interface ICardStatementImageRepository {
    findByStatementId(statementId: string): Promise<CardStatementImage[]>;
    createMany(images: Array<{ card_statement_id: string; image_path: string }>): Promise<void>;
}
