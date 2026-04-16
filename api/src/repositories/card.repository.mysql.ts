import { AppDataSource } from "../infra/database/data-source";
import { Card } from "../infra/database/entities/card.entity";
import { ICardRepository } from "../contracts/card-repository.interface";
import { CreateCardDto } from "../dtos/card/create-card.dto";
import { UpdateCardDto } from "../dtos/card/update-card.dto";
import { NotFoundError } from "../errors/not-found.error";

export class CardRepositoryMySQL implements ICardRepository {

    private repo = AppDataSource.getRepository(Card);

    async findAll(userId: string): Promise<Card[]> {
        return this.repo.findBy({ user_id: userId });
    }

    async findById(id: string): Promise<Card | null> {
        return this.repo.findOneBy({ id });
    }

    async findByIdAndUserId(id: string, userId: string): Promise<Card | null> {
        return this.repo.findOneBy({ id, user_id: userId });
    }

    async create(data: CreateCardDto, userId: string): Promise<Card> {
        return this.repo.save({ ...data, user_id: userId });
    }

    async update(id: string, data: UpdateCardDto): Promise<Card | null> {
        const result = await this.repo.update({ id }, data);

        if (result.affected === 0) {
            throw new NotFoundError({ message: 'Card not found' });
        }

        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        const result = await this.repo.softDelete(id);

        if (result.affected === 0) {
            throw new NotFoundError({ message: 'Card not found' });
        }
    }

    async isInUse(id: string): Promise<boolean> {
        // atualizar quando expenses for criado
        return false;
    }

}
