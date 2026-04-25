import { AppDataSource } from '../infra/database/data-source';
import {
    IAnalyticsRepository,
    AnalyticsFilters,
    GeneralMetrics,
    CategoryMetric,
    ExpiringMetrics,
} from '../contracts/analytics-repository.interface';

export class AnalyticsRepositoryMySQL implements IAnalyticsRepository {

    async getGeneralMetrics(filters: AnalyticsFilters): Promise<GeneralMetrics> {
        const txQuery = AppDataSource.createQueryBuilder()
            .select([
                'COALESCE(SUM(ct.parcel_value), 0) as total_installments',
                'COUNT(ct.id) as count_transactions',
                'COUNT(CASE WHEN ct.parcels = 1 THEN 1 END) as cash_count',
                'COALESCE(SUM(CASE WHEN ct.parcels = 1 THEN ct.parcel_value END), 0) as cash_total',
                'COUNT(CASE WHEN ct.parcels > 1 THEN 1 END) as installment_count',
                'COALESCE(SUM(CASE WHEN ct.parcels > 1 THEN ct.parcel_value END), 0) as installment_total',
            ])
            .from('card_transactions', 'ct')
            .innerJoin('card_statements', 'cs', 'ct.card_statement_id = cs.id')
            .where('ct.user_id = :userId', { userId: filters.userId })
            .andWhere('ct.deleted_at IS NULL')
            .andWhere('cs.deleted_at IS NULL');

        this.applyPeriodFilters(txQuery, filters);
        if (filters.categoryId) txQuery.andWhere('ct.expense_category_id = :categoryId', { categoryId: filters.categoryId });

        const stQuery = AppDataSource.createQueryBuilder()
            .select([
                'COALESCE(SUM(cs.total), 0) as total_due',
                'COUNT(CASE WHEN cs.status_id = 7 THEN 1 END) as statements_needing_review',
            ])
            .from('card_statements', 'cs')
            .where('cs.user_id = :userId', { userId: filters.userId })
            .andWhere('cs.deleted_at IS NULL');

        this.applyPeriodFilters(stQuery, filters, false);

        const [txResult, stResult] = await Promise.all([txQuery.getRawOne(), stQuery.getRawOne()]);

        return {
            total_installments: parseFloat(txResult.total_installments) || 0,
            total_due: parseFloat(stResult.total_due) || 0,
            count_transactions: parseInt(txResult.count_transactions) || 0,
            cash_count: parseInt(txResult.cash_count) || 0,
            cash_total: parseFloat(txResult.cash_total) || 0,
            installment_count: parseInt(txResult.installment_count) || 0,
            installment_total: parseFloat(txResult.installment_total) || 0,
            statements_needing_review: parseInt(stResult.statements_needing_review) || 0,
        };
    }

    async getByCategory(filters: AnalyticsFilters): Promise<CategoryMetric[]> {
        const query = AppDataSource.createQueryBuilder()
            .select([
                'ct.expense_category_id as category_id',
                'ec.category as category_name',
                'COUNT(ct.id) as count',
                'COALESCE(SUM(ct.parcel_value), 0) as total',
                'COALESCE(AVG(ct.parcel_value), 0) as avg_value',
            ])
            .from('card_transactions', 'ct')
            .innerJoin('card_statements', 'cs', 'ct.card_statement_id = cs.id')
            .innerJoin('expense_categories', 'ec', 'ct.expense_category_id = ec.id')
            .where('ct.user_id = :userId', { userId: filters.userId })
            .andWhere('ct.deleted_at IS NULL')
            .andWhere('cs.deleted_at IS NULL');

        this.applyPeriodFilters(query, filters);
        if (filters.categoryId) query.andWhere('ct.expense_category_id = :categoryId', { categoryId: filters.categoryId });
        query.groupBy('ct.expense_category_id');

        const results = await query.getRawMany();
        return results.map(r => ({
            category_id: r.category_id,
            category_name: r.category_name,
            count: parseInt(r.count) || 0,
            total: parseFloat(r.total) || 0,
            avg_value: parseFloat(parseFloat(r.avg_value).toFixed(2)) || 0,
        }));
    }

    async getExpiringPurchases(filters: AnalyticsFilters, refYear: number, refMonth: number): Promise<ExpiringMetrics> {
        const refMonthNum = refYear * 12 + refMonth;

        const col = '(cs.year_reference * 12 + cs.month_reference + (ct.parcels - ct.current_parcel))';

        const query = AppDataSource.createQueryBuilder()
            .select([
                `COUNT(CASE WHEN ${col} = :ref0 THEN 1 END) as this_count`,
                `COALESCE(SUM(CASE WHEN ${col} = :ref0 THEN ct.parcel_value END), 0) as this_total`,
                `COUNT(CASE WHEN ${col} = :ref1 THEN 1 END) as next_count`,
                `COALESCE(SUM(CASE WHEN ${col} = :ref1 THEN ct.parcel_value END), 0) as next_total`,
                `COUNT(CASE WHEN ${col} BETWEEN :ref2 AND :ref3 THEN 1 END) as within3_count`,
                `COALESCE(SUM(CASE WHEN ${col} BETWEEN :ref2 AND :ref3 THEN ct.parcel_value END), 0) as within3_total`,
            ])
            .from('card_transactions', 'ct')
            .innerJoin('card_statements', 'cs', 'ct.card_statement_id = cs.id')
            .where('ct.user_id = :userId', { userId: filters.userId })
            .andWhere('ct.deleted_at IS NULL')
            .andWhere('cs.deleted_at IS NULL')
            .setParameters({ ref0: refMonthNum, ref1: refMonthNum + 1, ref2: refMonthNum + 2, ref3: refMonthNum + 3 });

        this.applyPeriodFilters(query, filters);
        if (filters.categoryId) query.andWhere('ct.expense_category_id = :categoryId', { categoryId: filters.categoryId });

        const r = await query.getRawOne();
        return {
            ends_this_month: { count: parseInt(r.this_count) || 0, total: parseFloat(r.this_total) || 0 },
            ends_next_month: { count: parseInt(r.next_count) || 0, total: parseFloat(r.next_total) || 0 },
            ends_within_3_months: { count: parseInt(r.within3_count) || 0, total: parseFloat(r.within3_total) || 0 },
        };
    }

    private applyPeriodFilters(query: any, filters: AnalyticsFilters, includeCard = true): void {
        if (includeCard && filters.cardId) query.andWhere('cs.card_id = :cardId', { cardId: filters.cardId });
        if (filters.month && filters.year) {
            query.andWhere('cs.month_reference = :month', { month: filters.month });
            query.andWhere('cs.year_reference = :year', { year: filters.year });
        } else if (filters.year) {
            query.andWhere('cs.year_reference = :year', { year: filters.year });
        }
    }

}
