import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCardDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string | null;
}
