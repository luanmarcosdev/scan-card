import { CardService } from "../../src/services/card.service";
import { ICardRepository } from "../../src/contracts/card-repository.interface";
import { ICacheProvider } from "../../src/contracts/cache-provider.interface";
import { NotFoundError } from "../../src/errors/not-found.error";
import { ConflictError } from "../../src/errors/conflict.error";
import { BadRequestError } from "../../src/errors/bad-request.error";
import { Card } from "../../src/infra/database/entities/card.entity";

const mockCard: Card = {
    id: 'card-uuid-123',
    user_id: 'user-uuid-123',
    last_numbers: '1234',
    name: 'Nubank',
    created_at: new Date('2026-01-01'),
    updated_at: null,
    deleted_at: null,
};

describe("CardService", () => {
    let service: CardService;
    let cardRepository: jest.Mocked<ICardRepository>;
    let cacheProvider: jest.Mocked<ICacheProvider>;

    beforeEach(() => {
        jest.clearAllMocks();

        cardRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIdAndUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            isInUse: jest.fn(),
        };

        cacheProvider = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };

        service = new CardService(cardRepository, cacheProvider);
    });

    describe("findAll", () => {
        it("should return cached cards on cache hit", async () => {
            cacheProvider.get.mockResolvedValue(JSON.stringify([mockCard]));

            const result = await service.findAll('user-uuid-123');

            expect(result[0].id).toBe(mockCard.id);
            expect(cardRepository.findAll).not.toHaveBeenCalled();
        });

        it("should fetch from DB on cache miss and cache result", async () => {
            cacheProvider.get.mockResolvedValue(null);
            cardRepository.findAll.mockResolvedValue([mockCard]);

            const result = await service.findAll('user-uuid-123');

            expect(result).toEqual([mockCard]);
            expect(cacheProvider.set).toHaveBeenCalledWith('cards:user-uuid-123:all', JSON.stringify([mockCard]), 120);
        });
    });

    describe("findById", () => {
        it("should return cached card on cache hit", async () => {
            cacheProvider.get.mockResolvedValue(JSON.stringify(mockCard));

            const result = await service.findById('card-uuid-123', 'user-uuid-123');

            expect(result.id).toBe(mockCard.id);
            expect(cardRepository.findByIdAndUserId).not.toHaveBeenCalled();
        });

        it("should fetch from DB on cache miss", async () => {
            cacheProvider.get.mockResolvedValue(null);
            cardRepository.findByIdAndUserId.mockResolvedValue(mockCard);

            const result = await service.findById('card-uuid-123', 'user-uuid-123');

            expect(result).toEqual(mockCard);
            expect(cacheProvider.set).toHaveBeenCalledWith('cards:card-uuid-123', JSON.stringify(mockCard), 120);
        });

        it("should throw NotFoundError if card not found", async () => {
            cacheProvider.get.mockResolvedValue(null);
            cardRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.findById('card-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("create", () => {
        it("should create card and invalidate list cache", async () => {
            cardRepository.create.mockResolvedValue(mockCard);

            const result = await service.create('user-uuid-123', { last_numbers: '1234' });

            expect(result).toEqual(mockCard);
            expect(cardRepository.create).toHaveBeenCalledWith({ last_numbers: '1234' }, 'user-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('cards:user-uuid-123:all');
        });
    });

    describe("update", () => {
        it("should update card successfully", async () => {
            cardRepository.findByIdAndUserId.mockResolvedValue(mockCard);
            cardRepository.update.mockResolvedValue({ ...mockCard, name: 'Inter' });

            const result = await service.update('card-uuid-123', 'user-uuid-123', { name: 'Inter' });

            expect(result.name).toBe('Inter');
            expect(cacheProvider.del).toHaveBeenCalledWith('cards:card-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('cards:user-uuid-123:all');
        });

        it("should throw NotFoundError if card not found", async () => {
            cardRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.update('card-uuid-123', 'user-uuid-123', { name: 'Inter' })).rejects.toBeInstanceOf(NotFoundError);
        });

        it("should throw BadRequestError if no data provided", async () => {
            cardRepository.findByIdAndUserId.mockResolvedValue(mockCard);

            await expect(service.update('card-uuid-123', 'user-uuid-123', {})).rejects.toBeInstanceOf(BadRequestError);
        });
    });

    describe("delete", () => {
        it("should delete card successfully", async () => {
            cardRepository.findByIdAndUserId.mockResolvedValue(mockCard);
            cardRepository.isInUse.mockResolvedValue(false);

            await service.delete('card-uuid-123', 'user-uuid-123');

            expect(cardRepository.delete).toHaveBeenCalledWith('card-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('cards:card-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('cards:user-uuid-123:all');
        });

        it("should throw NotFoundError if card not found", async () => {
            cardRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.delete('card-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(NotFoundError);
        });

        it("should throw ConflictError if card is in use", async () => {
            cardRepository.findByIdAndUserId.mockResolvedValue(mockCard);
            cardRepository.isInUse.mockResolvedValue(true);

            await expect(service.delete('card-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(ConflictError);
            expect(cardRepository.delete).not.toHaveBeenCalled();
        });
    });
});
