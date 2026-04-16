export class CardResponseDto {
    id!: string;
    user_id!: string;
    last_numbers!: string;
    name!: string | null;
    created_at!: Date;
    updated_at!: Date | null;
    deleted_at!: Date | null;
}
