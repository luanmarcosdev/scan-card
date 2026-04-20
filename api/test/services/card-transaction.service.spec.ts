import { CardTransactionService } from "../../src/services/card-transaction.service";
import { ICardTransactionRepository } from "../../src/contracts/card-transaction-repository.interface";
import { IExpenseCategoryRepository } from "../../src/contracts/expense-category-repository.interface";
import { ICacheProvider } from "../../src/contracts/cache-provider.interface";
import { NotFoundError } from "../../src/errors/not-found.error";
import { BadRequestError } from "../../src/errors/bad-request.error";
import { CardTransaction } from "../../src/infra/database/entities/card-transaction.entity";
import { ExpenseCategory } from "../../src/infra/database/entities/expense-category.entity";

const mockTransaction: CardTransaction = {
    id: 'txn-uuid-123',
    user_id: 'user-uuid-123',
    card_statement_id: 'stmt-uuid-123',
    expense_category_id: 'cat-uuid-123',
    merchant: 'Mercado Livre',
    transaction_date: new Date('2026-04-01'),
    parcels: 1,
    parcel_value: null,
    total_value: 250.00,
    created_at: new Date('2026-04-01'),
    updated_at: null,
    deleted_at: null,
};

const mockCategory: ExpenseCategory = {
    id: 'cat-uuid-123',
    user_id: 'user-uuid-123',
    category: 'Food',
    description: null,
    created_at: new Date('2026-04-01'),
    updated_at: null,
    deleted_at: null,
};

describe("CardTransactionService", () => {
    let service: CardTransactionService;
    let transactionRepository: jest.Mocked<ICardTransactionRepository>;
    let cacheProvider: jest.Mocked<ICacheProvider>;
    let expenseCategoryRepository: jest.Mocked<IExpenseCategoryRepository>;

    beforeEach(() => {
        jest.clearAllMocks();

        transactionRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIdAndUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        cacheProvider = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };

        expenseCategoryRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIdAndUserId: jest.fn(),
            create: jest.fn(),
            createMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            isInUse: jest.fn(),
        };

        service = new CardTransactionService(transactionRepository, cacheProvider, expenseCategoryRepository);
    });

    describe("findAll", () => {
        it("should return cached transactions on cache hit", async () => {
            cacheProvider.get.mockResolvedValue(JSON.stringify([mockTransaction]));

            const result = await service.findAll('user-uuid-123', 'stmt-uuid-123');

            expect(result[0].id).toBe(mockTransaction.id);
            expect(transactionRepository.findAll).not.toHaveBeenCalled();
        });

        it("should fetch from DB on cache miss and cache result", async () => {
            cacheProvider.get.mockResolvedValue(null);
            transactionRepository.findAll.mockResolvedValue([mockTransaction]);

            const result = await service.findAll('user-uuid-123', 'stmt-uuid-123');

            expect(result).toEqual([mockTransaction]);
            expect(cacheProvider.set).toHaveBeenCalledWith(
                'card_transactions:stmt-uuid-123:all',
                JSON.stringify([mockTransaction]),
                120
            );
        });
    });

    describe("findById", () => {
        it("should return cached transaction on cache hit", async () => {
            cacheProvider.get.mockResolvedValue(JSON.stringify(mockTransaction));

            const result = await service.findById('txn-uuid-123', 'user-uuid-123');

            expect(result.id).toBe(mockTransaction.id);
            expect(transactionRepository.findByIdAndUserId).not.toHaveBeenCalled();
        });

        it("should fetch from DB on cache miss", async () => {
            cacheProvider.get.mockResolvedValue(null);
            transactionRepository.findByIdAndUserId.mockResolvedValue(mockTransaction);

            const result = await service.findById('txn-uuid-123', 'user-uuid-123');

            expect(result).toEqual(mockTransaction);
            expect(cacheProvider.set).toHaveBeenCalledWith(
                'card_transactions:txn-uuid-123',
                JSON.stringify(mockTransaction),
                120
            );
        });

        it("should throw NotFoundError if transaction not found", async () => {
            cacheProvider.get.mockResolvedValue(null);
            transactionRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.findById('txn-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("create", () => {
        it("should create transaction and invalidate list cache", async () => {
            expenseCategoryRepository.findByIdAndUserId.mockResolvedValue(mockCategory);
            transactionRepository.create.mockResolvedValue(mockTransaction);

            const result = await service.create('user-uuid-123', 'stmt-uuid-123', {
                expense_category_id: 'cat-uuid-123',
                total_value: 250,
            });

            expect(result).toEqual(mockTransaction);
            expect(transactionRepository.create).toHaveBeenCalledWith(
                { expense_category_id: 'cat-uuid-123', total_value: 250 },
                'user-uuid-123',
                'stmt-uuid-123'
            );
            expect(cacheProvider.del).toHaveBeenCalledWith('card_transactions:stmt-uuid-123:all');
        });

        it("should throw NotFoundError if expense category does not exist", async () => {
            expenseCategoryRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(
                service.create('user-uuid-123', 'stmt-uuid-123', {
                    expense_category_id: 'invalid-cat-id',
                    total_value: 250,
                })
            ).rejects.toBeInstanceOf(NotFoundError);

            expect(transactionRepository.create).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update transaction and invalidate caches", async () => {
            transactionRepository.findByIdAndUserId.mockResolvedValue(mockTransaction);
            transactionRepository.update.mockResolvedValue({ ...mockTransaction, merchant: 'Amazon' });

            const result = await service.update('txn-uuid-123', 'user-uuid-123', { merchant: 'Amazon' });

            expect(result.merchant).toBe('Amazon');
            expect(cacheProvider.del).toHaveBeenCalledWith('card_transactions:txn-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('card_transactions:stmt-uuid-123:all');
        });

        it("should throw NotFoundError if expense_category_id does not exist on update", async () => {
            transactionRepository.findByIdAndUserId.mockResolvedValue(mockTransaction);
            expenseCategoryRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(
                service.update('txn-uuid-123', 'user-uuid-123', { expense_category_id: 'invalid-cat-id' })
            ).rejects.toBeInstanceOf(NotFoundError);

            expect(transactionRepository.update).not.toHaveBeenCalled();
        });

        it("should throw NotFoundError if transaction not found", async () => {
            transactionRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.update('txn-uuid-123', 'user-uuid-123', { merchant: 'Amazon' })).rejects.toBeInstanceOf(NotFoundError);
        });

        it("should throw BadRequestError if no data provided", async () => {
            transactionRepository.findByIdAndUserId.mockResolvedValue(mockTransaction);

            await expect(service.update('txn-uuid-123', 'user-uuid-123', {})).rejects.toBeInstanceOf(BadRequestError);
        });
    });

    describe("delete", () => {
        it("should delete transaction and invalidate caches", async () => {
            transactionRepository.findByIdAndUserId.mockResolvedValue(mockTransaction);

            await service.delete('txn-uuid-123', 'user-uuid-123');

            expect(transactionRepository.delete).toHaveBeenCalledWith('txn-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('card_transactions:txn-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('card_transactions:stmt-uuid-123:all');
        });

        it("should throw NotFoundError if transaction not found", async () => {
            transactionRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.delete('txn-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(NotFoundError);
        });
    });
});
