export interface CategoryBreakdownDto {
    category_id: string;
    count: number;
    total: number;
    avg_value: number;
}

export interface AnalyticsResponseDto {
    general: {
        salary: number | null;
        total_installments: number;
        total_due: number;
        installments_salary_ratio: number | null;
        statements_needing_review: number;
    };
    transactions: {
        count: number;
        avg_value: number;
        by_category: CategoryBreakdownDto[];
    };
    purchases: {
        cash_count: number;
        installment_count: number;
        ends_this_month: number;
        ends_next_month: number;
        ends_within_3_months: number;
    };
}
