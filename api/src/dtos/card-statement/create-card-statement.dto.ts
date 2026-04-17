import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateCardStatementDto {
    @IsString()
    card_id!: string;

    @IsNumber()
    year_reference!: number;

    @IsNumber()
    @Min(1)
    @Max(12)
    month_reference!: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    total?: number | null;
}
