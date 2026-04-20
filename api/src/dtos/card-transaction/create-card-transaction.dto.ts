import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateCardTransactionDto {
    @IsString()
    expense_category_id!: string;

    @IsNumber()
    @Min(0)
    total_value!: number;

    @IsOptional()
    @IsString()
    merchant?: string | null;

    @IsOptional()
    @IsDateString()
    transaction_date?: string | null;

    @IsOptional()
    @IsNumber()
    @Min(1)
    parcels?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    parcel_value?: number | null;
}
