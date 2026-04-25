import { AnalyticsService } from '../../src/services/analytics.service';
import { IAnalyticsRepository, GeneralMetrics, CategoryMetric, ExpiringMetrics, PurchaseTransactionRaw } from '../../src/contracts/analytics-repository.interface';
import { IUserRepository } from '../../src/contracts/user-repository.interface';
import { User } from '../../src/infra/database/entities/user.entity';

const mockUser: User = {
    id: 'user-uuid',
    name: 'John',
    email: 'john@example.com',
    document: '12345678900',
    password: 'hashed',
    salary: 5000,
    phone: '11999999999',
    created_at: new Date(),
    updated_at: null,
    deleted_at: null,
};

const mockGeneralMetrics: GeneralMetrics = {
    total_installments: 1200,
    total_due: 1500,
    count_transactions: 10,
    cash_count: 3,
    cash_total: 300,
    installment_count: 7,
    installment_total: 900,
    statements_count: 2,
    statements_needing_review: 1,
};

const mockByCategory: CategoryMetric[] = [
    { category_id: 'cat-uuid-1', category_name: 'Food', count: 6, total: 800, avg_value: 133.33 },
    { category_id: 'cat-uuid-2', category_name: 'Transport', count: 4, total: 400, avg_value: 100 },
];

const mockExpiring: ExpiringMetrics = {
    ends_this_month: { count: 2, total: 150 },
    ends_next_month: { count: 1, total: 80 },
    ends_within_3_months: { count: 4, total: 320 },
};

const mockTransactions: PurchaseTransactionRaw[] = [
    { transaction_id: 'tx-1', card_id: 'card-1', card_last_numbers: '1234', card_name: 'Nubank', merchant: 'Amazon', transaction_date: '2026-04-10', parcels: 1, current_parcel: 1, parcel_value: 100, total_value: 100, expense_category_id: 'cat-uuid-1', lastParcelMonthNum: 0 },
    { transaction_id: 'tx-2', card_id: 'card-1', card_last_numbers: '1234', card_name: 'Nubank', merchant: 'Netflix', transaction_date: '2026-04-01', parcels: 3, current_parcel: 1, parcel_value: 200, total_value: 600, expense_category_id: 'cat-uuid-2', lastParcelMonthNum: 0 },
];

describe('AnalyticsService', () => {
    let service: AnalyticsService;
    let analyticsRepo: jest.Mocked<IAnalyticsRepository>;
    let userRepo: jest.Mocked<IUserRepository>;

    beforeEach(() => {
        jest.clearAllMocks();

        analyticsRepo = {
            getGeneralMetrics: jest.fn().mockResolvedValue(mockGeneralMetrics),
            getByCategory: jest.fn().mockResolvedValue(mockByCategory),
            getExpiringPurchases: jest.fn().mockResolvedValue(mockExpiring),
            getTransactions: jest.fn().mockResolvedValue(mockTransactions),
        };

        userRepo = {
            findById: jest.fn().mockResolvedValue(mockUser),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        service = new AnalyticsService(analyticsRepo, userRepo);
    });

    describe('getAnalytics', () => {
        it('should return full analytics DTO with all sections populated', async () => {
            const result = await service.getAnalytics('user-uuid', {});

            expect(result.general.salary).toBe(5000);
            expect(result.general.total_installments).toBe(1200);
            expect(result.general.total_due).toBe(1500);
            expect(result.general.statements_count).toBe(2);
            expect(result.general.statements_needing_review).toBe(1);
            expect(result.transactions.count).toBe(10);
            expect(result.transactions.by_category[0].salary_ratio).toBe(16.00);
            expect(result.transactions.by_category[0].due_ratio).toBe(53.33);
            expect(result.transactions.by_category[0].transactions).toHaveLength(1);
            expect(result.transactions.by_category[0].transactions[0].transaction_id).toBe('tx-1');
            expect(result.transactions.by_category[1].salary_ratio).toBe(8.00);
            expect(result.transactions.by_category[1].due_ratio).toBe(26.67);
            expect(result.transactions.by_category[1].transactions[0].transaction_id).toBe('tx-2');
            expect(result.purchases.cash.count).toBe(3);
            expect(result.purchases.cash.transactions).toHaveLength(1);
            expect(result.purchases.cash.transactions[0].transaction_id).toBe('tx-1');
            expect(result.purchases.installments.count).toBe(7);
            expect(result.purchases.installments.transactions).toHaveLength(1);
            expect(result.purchases.installments.transactions[0].transaction_id).toBe('tx-2');
            expect(result.purchases.ends_this_month.count).toBe(2);
        });

        it('should calculate installments_salary_ratio correctly', async () => {
            const result = await service.getAnalytics('user-uuid', {});

            expect(result.general.installments_salary_ratio).toBe(24.00);
        });

        it('should return installments_salary_ratio as null when salary is null', async () => {
            userRepo.findById.mockResolvedValue({ ...mockUser, salary: null });

            const result = await service.getAnalytics('user-uuid', {});

            expect(result.general.salary).toBeNull();
            expect(result.general.installments_salary_ratio).toBeNull();
            expect(result.transactions.by_category[0].salary_ratio).toBeNull();
        });

        it('should return due_ratio as null when total_due is 0', async () => {
            analyticsRepo.getGeneralMetrics.mockResolvedValue({ ...mockGeneralMetrics, total_due: 0 });

            const result = await service.getAnalytics('user-uuid', {});

            expect(result.transactions.by_category[0].due_ratio).toBeNull();
        });

        it('should return installments_salary_ratio as null when total_installments is 0', async () => {
            analyticsRepo.getGeneralMetrics.mockResolvedValue({ ...mockGeneralMetrics, total_installments: 0 });

            const result = await service.getAnalytics('user-uuid', {});

            expect(result.general.installments_salary_ratio).toBeNull();
        });

        it('should calculate avg_value correctly', async () => {
            const result = await service.getAnalytics('user-uuid', {});

            expect(result.transactions.avg_value).toBe(120.00);
        });

        it('should return avg_value as 0 when there are no transactions', async () => {
            analyticsRepo.getGeneralMetrics.mockResolvedValue({
                ...mockGeneralMetrics,
                count_transactions: 0,
                total_installments: 0,
            });

            const result = await service.getAnalytics('user-uuid', {});

            expect(result.transactions.avg_value).toBe(0);
        });

        it('should use month and year from filter as reference when both are provided', async () => {
            await service.getAnalytics('user-uuid', { month: 3, year: 2025 });

            expect(analyticsRepo.getExpiringPurchases).toHaveBeenCalledWith(
                expect.any(Object),
                2025,
                3,
            );
        });

        it('should use filter year with current month as reference when only year is provided', async () => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2026-04-15'));

            await service.getAnalytics('user-uuid', { year: 2025 });

            expect(analyticsRepo.getExpiringPurchases).toHaveBeenCalledWith(
                expect.any(Object),
                2025,
                4,
            );

            jest.useRealTimers();
        });

        it('should use current year and month as reference when no filter is provided', async () => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2026-04-15'));

            await service.getAnalytics('user-uuid', {});

            expect(analyticsRepo.getExpiringPurchases).toHaveBeenCalledWith(
                expect.any(Object),
                2026,
                4,
            );

            jest.useRealTimers();
        });

        it('should pass filters correctly to repository methods', async () => {
            const dto = { card_id: 'card-uuid', month: 5, year: 2026, category_id: 'cat-uuid' };

            await service.getAnalytics('user-uuid', dto);

            const expectedFilters = {
                userId: 'user-uuid',
                cardId: 'card-uuid',
                month: 5,
                year: 2026,
                categoryId: 'cat-uuid',
            };

            expect(analyticsRepo.getGeneralMetrics).toHaveBeenCalledWith(expectedFilters);
            expect(analyticsRepo.getByCategory).toHaveBeenCalledWith(expectedFilters);
            expect(analyticsRepo.getExpiringPurchases).toHaveBeenCalledWith(expectedFilters, 2026, 5);
        });
    });
});
