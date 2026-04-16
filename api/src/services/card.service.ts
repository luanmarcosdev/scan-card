import { Card } from "../infra/database/entities/card.entity";
import { ICardRepository } from "../contracts/card-repository.interface";
import { ICacheProvider } from "../contracts/cache-provider.interface";
import { CreateCardDto } from "../dtos/card/create-card.dto";
import { UpdateCardDto } from "../dtos/card/update-card.dto";
import { NotFoundError } from "../errors/not-found.error";
import { ConflictError } from "../errors/conflict.error";
import { BadRequestError } from "../errors/bad-request.error";

export class CardService {

    constructor(
        private readonly cardRepository: ICardRepository,
        private readonly cacheProvider: ICacheProvider,
    ) {}

    async findAll(userId: string): Promise<Card[]> {
        const cacheKey = `cards:${userId}:all`;
        const cached = await this.cacheProvider.get(cacheKey);

        if (cached) return JSON.parse(cached);

        const cards = await this.cardRepository.findAll(userId);

        await this.cacheProvider.set(cacheKey, JSON.stringify(cards), 120);

        return cards;
    }

    async findById(id: string, userId: string): Promise<Card> {
        const cacheKey = `cards:${id}`;
        const cached = await this.cacheProvider.get(cacheKey);

        if (cached) return JSON.parse(cached);

        const card = await this.cardRepository.findByIdAndUserId(id, userId);

        if (!card) {
            throw new NotFoundError({ message: 'Card not found' });
        }

        await this.cacheProvider.set(cacheKey, JSON.stringify(card), 120);

        return card;
    }

    async create(userId: string, data: CreateCardDto): Promise<Card> {
        const card = await this.cardRepository.create(data, userId);

        await this.cacheProvider.del(`cards:${userId}:all`);

        return card;
    }

    async update(id: string, userId: string, data: UpdateCardDto): Promise<Card> {
        const card = await this.cardRepository.findByIdAndUserId(id, userId);

        if (!card) {
            throw new NotFoundError({ message: 'Card not found' });
        }

        if (data.name === undefined) {
            throw new BadRequestError({
                message: 'No data provided for update',
                errors: { required: 'provide at least: name' },
            });
        }

        const updated = await this.cardRepository.update(id, data);

        if (!updated) {
            throw new NotFoundError({ message: 'Card not found' });
        }

        this.cacheProvider.del(`cards:${id}`);
        this.cacheProvider.del(`cards:${userId}:all`);

        return updated;
    }

    async delete(id: string, userId: string): Promise<void> {
        const card = await this.cardRepository.findByIdAndUserId(id, userId);

        if (!card) {
            throw new NotFoundError({ message: 'Card not found' });
        }

        const inUse = await this.cardRepository.isInUse(id);

        if (inUse) {
            throw new ConflictError({ message: 'Card is in use and cannot be deleted' });
        }

        await this.cardRepository.delete(id);
        await this.cacheProvider.del(`cards:${id}`);
        await this.cacheProvider.del(`cards:${userId}:all`);
    }

}
