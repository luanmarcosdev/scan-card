import { IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";

export class UpdateCardTransactionDto {
    @IsOptional()
    @IsString()
    expense_category_id?: string;

    @IsOptional()
    @IsString()
    merchant?: string | null;

    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'transaction_date must be a date in YYYY-MM-DD format' })
    transaction_date?: string | null;

    @IsOptional()
    @IsNumber()
    @Min(1)
    parcels?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    parcel_value?: number | null;

    @IsOptional()
    @IsNumber()
    @Min(0)
    total_value?: number;
}
