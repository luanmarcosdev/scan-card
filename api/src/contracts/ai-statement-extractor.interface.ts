export interface AiTransaction {
    expense_category_id: string;
    merchant: string | null;
    transaction_date: string | null;
    parcels: number;
    current_parcel: number;
    parcel_value: number | null;
    total: number;
}

export interface AiExtractionResult {
    valid: boolean;
    transactions: AiTransaction[];
    inputTokens: number | null;
    outputTokens: number | null;
    rawResponse: object | null;
}

export interface IAiStatementExtractor {
    analyseAndExtractTransactions(params: {
        imagePaths: string[];
        categoryList: Array<{ id: string; name: string }>;
        monthReference: number;
        yearReference: number;
    }): Promise<AiExtractionResult>;
}
