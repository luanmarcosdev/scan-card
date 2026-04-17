import { CardStatementService, ImageFile } from "../../src/services/card-statement.service";
import { ICardStatementRepository } from "../../src/contracts/card-statement-repository.interface";
import { ICardStatementImageRepository } from "../../src/contracts/card-statement-image-repository.interface";
import { ICacheProvider } from "../../src/contracts/cache-provider.interface";
import { IStorageProvider } from "../../src/contracts/storage-provider.interface";
import { NotFoundError } from "../../src/errors/not-found.error";
import { ConflictError } from "../../src/errors/conflict.error";
import { BadRequestError } from "../../src/errors/bad-request.error";
import { CardStatement } from "../../src/infra/database/entities/card-statement.entity";

const mockStatement: CardStatement = {
    id: 'stmt-uuid-123',
    card_id: 'card-uuid-123',
    user_id: 'user-uuid-123',
    status_id: 1,
    year_reference: 2026,
    month_reference: 4,
    total: 1500.00,
    created_at: new Date('2026-01-01'),
    updated_at: null,
    deleted_at: null,
};

const mockFiles: ImageFile[] = [
    { filename: 'fatura.jpg', buffer: Buffer.from('img1') },
    { filename: 'fatura2.jpg', buffer: Buffer.from('img2') },
];

describe("CardStatementService", () => {
    let service: CardStatementService;
    let statementRepository: jest.Mocked<ICardStatementRepository>;
    let imageRepository: jest.Mocked<ICardStatementImageRepository>;
    let cacheProvider: jest.Mocked<ICacheProvider>;
    let storageProvider: jest.Mocked<IStorageProvider>;

    beforeEach(() => {
        jest.clearAllMocks();

        statementRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIdAndUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            delete: jest.fn(),
        };

        imageRepository = {
            findByStatementId: jest.fn(),
            createMany: jest.fn(),
        };

        cacheProvider = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };

        storageProvider = {
            save: jest.fn(),
            delete: jest.fn(),
        };

        service = new CardStatementService(statementRepository, imageRepository, cacheProvider, storageProvider);
    });

    describe("findAll", () => {
        it("should return cached statements on cache hit", async () => {
            cacheProvider.get.mockResolvedValue(JSON.stringify([mockStatement]));

            const result = await service.findAll('user-uuid-123');

            expect(result[0].id).toBe(mockStatement.id);
            expect(statementRepository.findAll).not.toHaveBeenCalled();
        });

        it("should fetch from DB on cache miss and cache result", async () => {
            cacheProvider.get.mockResolvedValue(null);
            statementRepository.findAll.mockResolvedValue([mockStatement]);

            const result = await service.findAll('user-uuid-123');

            expect(result).toEqual([mockStatement]);
            expect(cacheProvider.set).toHaveBeenCalledWith(
                'card_statements:user-uuid-123:all',
                JSON.stringify([mockStatement]),
                120
            );
        });
    });

    describe("findById", () => {
        it("should return cached statement on cache hit", async () => {
            cacheProvider.get.mockResolvedValue(JSON.stringify(mockStatement));

            const result = await service.findById('stmt-uuid-123', 'user-uuid-123');

            expect(result.id).toBe(mockStatement.id);
            expect(statementRepository.findByIdAndUserId).not.toHaveBeenCalled();
        });

        it("should fetch from DB on cache miss", async () => {
            cacheProvider.get.mockResolvedValue(null);
            statementRepository.findByIdAndUserId.mockResolvedValue(mockStatement);

            const result = await service.findById('stmt-uuid-123', 'user-uuid-123');

            expect(result).toEqual(mockStatement);
            expect(cacheProvider.set).toHaveBeenCalledWith(
                'card_statements:stmt-uuid-123',
                JSON.stringify(mockStatement),
                120
            );
        });

        it("should throw NotFoundError if statement not found", async () => {
            cacheProvider.get.mockResolvedValue(null);
            statementRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.findById('stmt-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("create", () => {
        it("should create statement, save images and invalidate list cache", async () => {
            statementRepository.create.mockResolvedValue(mockStatement);
            storageProvider.save
                .mockResolvedValueOnce('/uploads/user-uuid-123/stmt-uuid-123/fatura.jpg')
                .mockResolvedValueOnce('/uploads/user-uuid-123/stmt-uuid-123/fatura2.jpg');

            const result = await service.create('user-uuid-123', {
                card_id: 'card-uuid-123',
                year_reference: 2026,
                month_reference: 4,
                total: 1500,
            }, mockFiles);

            expect(result.status_id).toBe(2);
            expect(storageProvider.save).toHaveBeenCalledTimes(2);
            expect(imageRepository.createMany).toHaveBeenCalledWith([
                { card_statement_id: 'stmt-uuid-123', image_path: '/uploads/user-uuid-123/stmt-uuid-123/fatura.jpg' },
                { card_statement_id: 'stmt-uuid-123', image_path: '/uploads/user-uuid-123/stmt-uuid-123/fatura2.jpg' },
            ]);
            expect(statementRepository.updateStatus).toHaveBeenCalledWith('stmt-uuid-123', 2);
            expect(cacheProvider.del).toHaveBeenCalledWith('card_statements:user-uuid-123:all');
        });

        it("should throw BadRequestError if no files provided", async () => {
            await expect(
                service.create('user-uuid-123', { card_id: 'card-uuid-123', year_reference: 2026, month_reference: 4 }, [])
            ).rejects.toBeInstanceOf(BadRequestError);

            expect(statementRepository.create).not.toHaveBeenCalled();
        });

        it("should throw BadRequestError if file has invalid extension", async () => {
            const invalidFiles = [{ filename: 'fatura.pdf', buffer: Buffer.from('pdf') }];

            await expect(
                service.create('user-uuid-123', { card_id: 'card-uuid-123', year_reference: 2026, month_reference: 4 }, invalidFiles)
            ).rejects.toBeInstanceOf(BadRequestError);

            expect(statementRepository.create).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update total and invalidate cache", async () => {
            statementRepository.findByIdAndUserId.mockResolvedValue(mockStatement);
            statementRepository.update.mockResolvedValue({ ...mockStatement, total: 2000 });

            const result = await service.update('stmt-uuid-123', 'user-uuid-123', { total: 2000 });

            expect(result.total).toBe(2000);
            expect(cacheProvider.del).toHaveBeenCalledWith('card_statements:stmt-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('card_statements:user-uuid-123:all');
        });

        it("should throw NotFoundError if statement not found", async () => {
            statementRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.update('stmt-uuid-123', 'user-uuid-123', { total: 2000 })).rejects.toBeInstanceOf(NotFoundError);
        });

        it("should throw BadRequestError if no data provided", async () => {
            statementRepository.findByIdAndUserId.mockResolvedValue(mockStatement);

            await expect(service.update('stmt-uuid-123', 'user-uuid-123', {})).rejects.toBeInstanceOf(BadRequestError);
        });
    });

    describe("delete", () => {
        it.each([1, 4, 6])("should delete when status is %i", async (statusId) => {
            statementRepository.findByIdAndUserId.mockResolvedValue({ ...mockStatement, status_id: statusId });

            await service.delete('stmt-uuid-123', 'user-uuid-123');

            expect(statementRepository.delete).toHaveBeenCalledWith('stmt-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('card_statements:stmt-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('card_statements:user-uuid-123:all');
        });

        it.each([2, 3, 5])("should throw ConflictError when status is %i", async (statusId) => {
            statementRepository.findByIdAndUserId.mockResolvedValue({ ...mockStatement, status_id: statusId });

            await expect(service.delete('stmt-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(ConflictError);
            expect(statementRepository.delete).not.toHaveBeenCalled();
        });

        it("should throw NotFoundError if statement not found", async () => {
            statementRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.delete('stmt-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(NotFoundError);
        });
    });
});
