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
                'COUNT(CASE WHEN ct.parcels > 1 THEN 1 END) as installment_count',
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
            installment_count: parseInt(txResult.installment_count) || 0,
            statements_needing_review: parseInt(stResult.statements_needing_review) || 0,
        };
    }

    async getByCategory(filters: AnalyticsFilters): Promise<CategoryMetric[]> {
        const query = AppDataSource.createQueryBuilder()
            .select([
                'ct.expense_category_id as category_id',
                'COUNT(ct.id) as count',
                'COALESCE(SUM(ct.parcel_value), 0) as total',
                'COALESCE(AVG(ct.parcel_value), 0) as avg_value',
            ])
            .from('card_transactions', 'ct')
            .innerJoin('card_statements', 'cs', 'ct.card_statement_id = cs.id')
            .where('ct.user_id = :userId', { userId: filters.userId })
            .andWhere('ct.deleted_at IS NULL')
            .andWhere('cs.deleted_at IS NULL');

        this.applyPeriodFilters(query, filters);
        if (filters.categoryId) query.andWhere('ct.expense_category_id = :categoryId', { categoryId: filters.categoryId });
        query.groupBy('ct.expense_category_id');

        const results = await query.getRawMany();
        return results.map(r => ({
            category_id: r.category_id,
            count: parseInt(r.count) || 0,
            total: parseFloat(r.total) || 0,
            avg_value: parseFloat(r.avg_value) || 0,
        }));
    }

    async getExpiringPurchases(filters: AnalyticsFilters, refYear: number, refMonth: number): Promise<ExpiringMetrics> {
        const refMonthNum = refYear * 12 + refMonth;

        const query = AppDataSource.createQueryBuilder()
            .select([
                'COUNT(CASE WHEN (cs.year_reference * 12 + cs.month_reference + (ct.parcels - ct.current_parcel)) = :ref0 THEN 1 END) as ends_this_month',
                'COUNT(CASE WHEN (cs.year_reference * 12 + cs.month_reference + (ct.parcels - ct.current_parcel)) = :ref1 THEN 1 END) as ends_next_month',
                'COUNT(CASE WHEN (cs.year_reference * 12 + cs.month_reference + (ct.parcels - ct.current_parcel)) BETWEEN :ref0 AND :ref3 THEN 1 END) as ends_within_3_months',
            ])
            .from('card_transactions', 'ct')
            .innerJoin('card_statements', 'cs', 'ct.card_statement_id = cs.id')
            .where('ct.user_id = :userId', { userId: filters.userId })
            .andWhere('ct.deleted_at IS NULL')
            .andWhere('cs.deleted_at IS NULL')
            .setParameters({ ref0: refMonthNum, ref1: refMonthNum + 1, ref3: refMonthNum + 3 });

        if (filters.cardId) query.andWhere('cs.card_id = :cardId', { cardId: filters.cardId });
        if (filters.categoryId) query.andWhere('ct.expense_category_id = :categoryId', { categoryId: filters.categoryId });

        const result = await query.getRawOne();
        return {
            ends_this_month: parseInt(result.ends_this_month) || 0,
            ends_next_month: parseInt(result.ends_next_month) || 0,
            ends_within_3_months: parseInt(result.ends_within_3_months) || 0,
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
