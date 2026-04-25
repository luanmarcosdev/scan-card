import { IsOptional, IsInt, Min, Max, IsUUID, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryAnalyticsTransactionsDto {

    @IsOptional()
    @IsUUID()
    card_id?: string;

    @IsOptional()
    @Transform(({ value }) => value !== undefined ? parseInt(value) : undefined)
    @IsInt()
    @Min(1)
    @Max(12)
    month?: number;

    @IsOptional()
    @Transform(({ value }) => value !== undefined ? parseInt(value) : undefined)
    @IsInt()
    @Min(2000)
    year?: number;

    @IsOptional()
    @IsUUID()
    category_id?: string;

    @IsOptional()
    @IsIn(['cash', 'installments', 'ends_this_month', 'ends_next_month', 'ends_within_3_months'])
    type?: string;

}
