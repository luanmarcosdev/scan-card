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

export interface PurchaseTransactionItem {
    transaction_id: string;
    expense_category_id: string;
    expense_category_name: string;
    card_id: string;
    card_last_numbers: string;
    card_name: string | null;
    merchant: string | null;
    transaction_date: string | null;
    parcels: number;
    current_parcel: number;
    parcel_value: number | null;
    total_value: number;
}

export interface PurchaseTransactionRaw extends PurchaseTransactionItem {
    lastParcelMonthNum: number;
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
    getTransactions(filters: AnalyticsFilters): Promise<PurchaseTransactionRaw[]>;
}
