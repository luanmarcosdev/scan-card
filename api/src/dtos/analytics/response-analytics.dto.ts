export interface CategoryBreakdownDto {
    category_id: string;
    category_name: string;
    count: number;
    total: number;
    avg_value: number;
    salary_ratio: number | null;
    due_ratio: number | null;
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
        cash: { count: number; total: number };
        installments: { count: number; total: number };
        ends_this_month: { count: number; total: number };
        ends_next_month: { count: number; total: number };
        ends_within_3_months: { count: number; total: number };
    };
}
