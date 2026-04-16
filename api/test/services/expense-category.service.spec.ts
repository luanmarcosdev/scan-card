import { ExpenseCategoryService } from "../../src/services/expense-category.service";
import { IExpenseCategoryRepository } from "../../src/contracts/expense-category-repository.interface";
import { ICacheProvider } from "../../src/contracts/cache-provider.interface";
import { NotFoundError } from "../../src/errors/not-found.error";
import { ConflictError } from "../../src/errors/conflict.error";
import { BadRequestError } from "../../src/errors/bad-request.error";
import { ExpenseCategory } from "../../src/infra/database/entities/expense-category.entity";

const mockCategory: ExpenseCategory = {
    id: 'cat-uuid-123',
    user_id: 'user-uuid-123',
    category: 'Alimentacao',
    description: null,
    created_at: new Date('2026-01-01'),
    updated_at: null,
    deleted_at: null,
};

describe("ExpenseCategoryService", () => {
    let service: ExpenseCategoryService;
    let categoryRepository: jest.Mocked<IExpenseCategoryRepository>;
    let cacheProvider: jest.Mocked<ICacheProvider>;

    beforeEach(() => {
        jest.clearAllMocks();

        categoryRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIdAndUserId: jest.fn(),
            create: jest.fn(),
            createMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            isInUse: jest.fn(),
        };

        cacheProvider = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };

        service = new ExpenseCategoryService(categoryRepository, cacheProvider);
    });

    describe("findAll", () => {
        it("should return cached categories on cache hit", async () => {
            cacheProvider.get.mockResolvedValue(JSON.stringify([mockCategory]));

            const result = await service.findAll('user-uuid-123');

            expect(result[0].id).toBe(mockCategory.id);
            expect(categoryRepository.findAll).not.toHaveBeenCalled();
        });

        it("should fetch from DB on cache miss and cache result", async () => {
            cacheProvider.get.mockResolvedValue(null);
            categoryRepository.findAll.mockResolvedValue([mockCategory]);

            const result = await service.findAll('user-uuid-123');

            expect(result).toEqual([mockCategory]);
            expect(cacheProvider.set).toHaveBeenCalledWith(
                'expense_categories:user-uuid-123:all',
                JSON.stringify([mockCategory]),
                120
            );
        });
    });

    describe("findById", () => {
        it("should return cached category on cache hit", async () => {
            cacheProvider.get.mockResolvedValue(JSON.stringify(mockCategory));

            const result = await service.findById('cat-uuid-123', 'user-uuid-123');

            expect(result.id).toBe(mockCategory.id);
            expect(categoryRepository.findByIdAndUserId).not.toHaveBeenCalled();
        });

        it("should fetch from DB on cache miss", async () => {
            cacheProvider.get.mockResolvedValue(null);
            categoryRepository.findByIdAndUserId.mockResolvedValue(mockCategory);

            const result = await service.findById('cat-uuid-123', 'user-uuid-123');

            expect(result).toEqual(mockCategory);
            expect(cacheProvider.set).toHaveBeenCalledWith(
                'expense_categories:cat-uuid-123',
                JSON.stringify(mockCategory),
                120
            );
        });

        it("should throw NotFoundError if category not found", async () => {
            cacheProvider.get.mockResolvedValue(null);
            categoryRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.findById('cat-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("create", () => {
        it("should create category and invalidate list cache", async () => {
            categoryRepository.create.mockResolvedValue(mockCategory);

            const result = await service.create('user-uuid-123', { category: 'Alimentacao' });

            expect(result).toEqual(mockCategory);
            expect(categoryRepository.create).toHaveBeenCalledWith({ category: 'Alimentacao' }, 'user-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('expense_categories:user-uuid-123:all');
        });
    });

    describe("createDefaults", () => {
        it("should create 7 default categories for user", async () => {
            await service.createDefaults('user-uuid-123');

            expect(categoryRepository.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ user_id: 'user-uuid-123' }),
                ])
            );

            const call = categoryRepository.createMany.mock.calls[0][0];
            expect(call).toHaveLength(7);
        });
    });

    describe("update", () => {
        it("should update category successfully", async () => {
            categoryRepository.findByIdAndUserId.mockResolvedValue(mockCategory);
            categoryRepository.update.mockResolvedValue({ ...mockCategory, category: 'Saude' });

            const result = await service.update('cat-uuid-123', 'user-uuid-123', { category: 'Saude' });

            expect(result.category).toBe('Saude');
            expect(cacheProvider.del).toHaveBeenCalledWith('expense_categories:cat-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('expense_categories:user-uuid-123:all');
        });

        it("should throw NotFoundError if category not found", async () => {
            categoryRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.update('cat-uuid-123', 'user-uuid-123', { category: 'Saude' })).rejects.toBeInstanceOf(NotFoundError);
        });

        it("should throw BadRequestError if no data provided", async () => {
            categoryRepository.findByIdAndUserId.mockResolvedValue(mockCategory);

            await expect(service.update('cat-uuid-123', 'user-uuid-123', {})).rejects.toBeInstanceOf(BadRequestError);
        });
    });

    describe("delete", () => {
        it("should delete category successfully", async () => {
            categoryRepository.findByIdAndUserId.mockResolvedValue(mockCategory);
            categoryRepository.isInUse.mockResolvedValue(false);

            await service.delete('cat-uuid-123', 'user-uuid-123');

            expect(categoryRepository.delete).toHaveBeenCalledWith('cat-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('expense_categories:cat-uuid-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('expense_categories:user-uuid-123:all');
        });

        it("should throw NotFoundError if category not found", async () => {
            categoryRepository.findByIdAndUserId.mockResolvedValue(null);

            await expect(service.delete('cat-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(NotFoundError);
        });

        it("should throw ConflictError if category is in use", async () => {
            categoryRepository.findByIdAndUserId.mockResolvedValue(mockCategory);
            categoryRepository.isInUse.mockResolvedValue(true);

            await expect(service.delete('cat-uuid-123', 'user-uuid-123')).rejects.toBeInstanceOf(ConflictError);
            expect(categoryRepository.delete).not.toHaveBeenCalled();
        });
    });
});
