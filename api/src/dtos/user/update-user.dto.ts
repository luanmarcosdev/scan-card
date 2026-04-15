import { IsNumber, IsOptional, IsString, Matches, Min, MinLength } from "class-validator";

export class UserUpdateDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    name?: string;

    @IsOptional()
    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/, {
        message: 'password must be at least 6 characters and contain uppercase, lowercase and a number',
    })
    password?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    salary?: number | null;
}
