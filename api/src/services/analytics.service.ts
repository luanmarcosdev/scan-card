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

        const [user, general, byCategory, expiring] = await Promise.all([
            this.userRepo.findById(userId),
            this.analyticsRepo.getGeneralMetrics(filters),
            this.analyticsRepo.getByCategory(filters),
            this.analyticsRepo.getExpiringPurchases(filters, refYear, refMonth),
        ]);

        const salary = user?.salary ?? null;
        const installments_salary_ratio = salary && general.total_installments
            ? parseFloat(((general.total_installments / salary) * 100).toFixed(2))
            : null;

        const avg_value = general.count_transactions > 0
            ? parseFloat((general.total_installments / general.count_transactions).toFixed(2))
            : 0;

        return {
            general: {
                salary,
                total_installments: general.total_installments,
                total_due: general.total_due,
                installments_salary_ratio,
                statements_needing_review: general.statements_needing_review,
            },
            transactions: {
                count: general.count_transactions,
                avg_value,
                by_category: byCategory,
            },
            purchases: {
                cash_count: general.cash_count,
                installment_count: general.installment_count,
                ends_this_month: expiring.ends_this_month,
                ends_next_month: expiring.ends_next_month,
                ends_within_3_months: expiring.ends_within_3_months,
            },
        };
    }

}
