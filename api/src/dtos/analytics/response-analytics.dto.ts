export interface PurchaseTransactionDto {
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

export interface CategoryBreakdownDto {
    category_id: string;
    category_name: string;
    count: number;
    total: number;
    avg_value: number;
    salary_ratio: number | null;
    due_ratio: number | null;
}

export interface PurchaseGroupDto {
    count: number;
    total: number;
}

export interface AnalyticsResponseDto {
    general: {
        salary: number | null;
        total_installments: number;
        total_due: number;
        installments_salary_ratio: number | null;
        statements_count: number;
        statements_needing_review: number;
    };
    transactions: {
        count: number;
        avg_value: number;
        by_category: CategoryBreakdownDto[];
    };
    purchases: {
        cash: PurchaseGroupDto;
        installments: PurchaseGroupDto;
        ends_this_month: PurchaseGroupDto;
        ends_next_month: PurchaseGroupDto;
        ends_within_3_months: PurchaseGroupDto;
    };
}
