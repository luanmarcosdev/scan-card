import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateExpenseCategoryDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    category?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    description?: string | null;
}
