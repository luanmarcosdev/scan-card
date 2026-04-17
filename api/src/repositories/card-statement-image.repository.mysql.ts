import { AppDataSource } from "../infra/database/data-source";
import { CardStatementImage } from "../infra/database/entities/card-statement-image.entity";
import { ICardStatementImageRepository } from "../contracts/card-statement-image-repository.interface";

export class CardStatementImageRepositoryMySQL implements ICardStatementImageRepository {

    private repo = AppDataSource.getRepository(CardStatementImage);

    async findByStatementId(statementId: string): Promise<CardStatementImage[]> {
        return this.repo.findBy({ card_statement_id: statementId });
    }

    async createMany(images: Array<{ card_statement_id: string; image_path: string }>): Promise<void> {
        await this.repo.save(images);
    }

}
