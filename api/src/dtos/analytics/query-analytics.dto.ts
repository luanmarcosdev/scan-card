import { IsOptional, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryAnalyticsDto {

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

}
