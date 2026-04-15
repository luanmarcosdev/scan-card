export class UserResponseDto {
    id!: string;
    name!: string;
    email!: string;
    document!: string;
    salary!: number | null;
    phone!: string;
    created_at!: Date;
    updated_at!: Date | null;
    deleted_at!: Date | null;
}
