import { IsEmail, IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";
import { IsCpf } from "../../utils/cpf.validator";
import { IsPhone } from "../../utils/phone.validator";

export class UserCreateDto {
    @IsString()
    name!: string;

    @IsEmail()
    email!: string;

    @IsCpf()
    document!: string;

    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/, {
        message: 'password must be at least 6 characters and contain uppercase, lowercase and a number',
    })
    password!: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    salary?: number | null;

    @IsPhone()
    phone!: string;
}
