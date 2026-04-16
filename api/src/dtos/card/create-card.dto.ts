import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class CreateCardDto {
    @IsString()
    @Matches(/^\d{4}$/, { message: 'last_numbers must contain exactly 4 numeric digits' })
    last_numbers!: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string | null;
}
