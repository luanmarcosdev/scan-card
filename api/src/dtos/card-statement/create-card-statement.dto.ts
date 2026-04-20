import { Transform } from "class-transformer";
import { IsNumber, IsOptional, Max, Min } from "class-validator";

export class CreateCardStatementDto {
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    year_reference!: number;

    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    @Max(12)
    month_reference!: number;

    @IsOptional()
    @Transform(({ value }) => value !== undefined ? parseFloat(value) : undefined)
    @IsNumber()
    @Min(0)
    total?: number | null;
}
