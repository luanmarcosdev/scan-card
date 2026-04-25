import { IAnalyticsRepository } from '../contracts/analytics-repository.interface';
import { IUserRepository } from '../contracts/user-repository.interface';
import { QueryAnalyticsDto } from '../dtos/analytics/query-analytics.dto';
import { AnalyticsResponseDto } from '../dtos/analytics/response-analytics.dto';

export class AnalyticsService {

    constructor(
        private readonly analyticsRepo: IAnalyticsRepository,
        private readonly userRepo: IUserRepository,
    ) {}

    async getAnalytics(userId: string, dto: QueryAnalyticsDto): Promise<AnalyticsResponseDto> {
        const now = new Date();
        const refYear = dto.year ?? now.getFullYear();
        const refMonth = (dto.month && dto.year) ? dto.month : now.getMonth() + 1;

        const filters = {
            userId,
            cardId: dto.card_id,
            month: dto.month,
            year: dto.year,
            categoryId: dto.category_id,
        };

        const [user, general, byCategory, expiring, allTransactions] = await Promise.all([
            this.userRepo.findById(userId),
            this.analyticsRepo.getGeneralMetrics(filters),
            this.analyticsRepo.getByCategory(filters),
            this.analyticsRepo.getExpiringPurchases(filters, refYear, refMonth),
            this.analyticsRepo.getTransactions(filters),
        ]);

        const salary = user?.salary ?? null;
        const installments_salary_ratio = salary && general.total_installments
            ? parseFloat(((general.total_installments / salary) * 100).toFixed(2))
            : null;

        const avg_value = general.count_transactions > 0
            ? parseFloat((general.total_installments / general.count_transactions).toFixed(2))
            : 0;

        const refMonthNum = refYear * 12 + refMonth;

        const toItem = ({ lastParcelMonthNum: _, expense_category_id: __, ...t }: typeof allTransactions[0]) => t;

        const txByCategory = new Map<string, typeof allTransactions>();
        for (const tx of allTransactions) {
            const group = txByCategory.get(tx.expense_category_id) ?? [];
            group.push(tx);
            txByCategory.set(tx.expense_category_id, group);
        }

        const cashTx = allTransactions.filter(t => t.parcels === 1).map(toItem);
        const installmentsTx = allTransactions.filter(t => t.parcels > 1).map(toItem);
        const endsThisMonthTx = allTransactions.filter(t => t.lastParcelMonthNum === refMonthNum).map(toItem);
        const endsNextMonthTx = allTransactions.filter(t => t.lastParcelMonthNum === refMonthNum + 1).map(toItem);
        const endsWithin3MonthsTx = allTransactions.filter(t => t.lastParcelMonthNum >= refMonthNum + 2 && t.lastParcelMonthNum <= refMonthNum + 3).map(toItem);

        return {
            general: {
                salary,
                total_installments: general.total_installments,
                total_due: general.total_due,
                installments_salary_ratio,
                statements_count: general.statements_count,
                statements_needing_review: general.statements_needing_review,
            },
            transactions: {
                count: general.count_transactions,
                avg_value,
                by_category: byCategory.map(c => ({
                    ...c,
                    salary_ratio: salary && c.total
                        ? parseFloat(((c.total / salary) * 100).toFixed(2))
                        : null,
                    due_ratio: general.total_due && c.total
                        ? parseFloat(((c.total / general.total_due) * 100).toFixed(2))
                        : null,
                    transactions: (txByCategory.get(c.category_id) ?? []).map(toItem),
                })),
            },
            purchases: {
                cash: { count: general.cash_count, total: general.cash_total, transactions: cashTx },
                installments: { count: general.installment_count, total: general.installment_total, transactions: installmentsTx },
                ends_this_month: { ...expiring.ends_this_month, transactions: endsThisMonthTx },
                ends_next_month: { ...expiring.ends_next_month, transactions: endsNextMonthTx },
                ends_within_3_months: { ...expiring.ends_within_3_months, transactions: endsWithin3MonthsTx },
            },
        };
    }

}
