export interface AnalyticsFilters {
    userId: string;
    cardId?: string;
    month?: number;
    year?: number;
    categoryId?: string;
}

export interface GeneralMetrics {
    total_installments: number;
    total_due: number;
    count_transactions: number;
    cash_count: number;
    cash_total: number;
    installment_count: number;
    installment_total: number;
    statements_count: number;
    statements_needing_review: number;
}

export interface CategoryMetric {
    category_id: string;
    category_name: string;
    count: number;
    total: number;
    avg_value: number;
}

export interface PurchaseGroup {
    count: number;
    total: number;
}

export interface ExpiringMetrics {
    ends_this_month: PurchaseGroup;
    ends_next_month: PurchaseGroup;
    ends_within_3_months: PurchaseGroup;
}

export interface IAnalyticsRepository {
    getGeneralMetrics(filters: AnalyticsFilters): Promise<GeneralMetrics>;
    getByCategory(filters: AnalyticsFilters): Promise<CategoryMetric[]>;
    getExpiringPurchases(filters: AnalyticsFilters, refYear: number, refMonth: number): Promise<ExpiringMetrics>;
}
