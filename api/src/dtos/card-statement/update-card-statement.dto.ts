import { IsNumber, IsOptional, Min } from "class-validator";

export class UpdateCardStatementDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    total?: number | null;
}
