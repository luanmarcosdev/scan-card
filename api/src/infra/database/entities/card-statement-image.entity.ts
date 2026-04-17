import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('card_statement_images')
export class CardStatementImage {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'card_statement_id', length: 36 })
    card_statement_id!: string;

    @Column({ name: 'image_path', length: 255 })
    image_path!: string;

    @CreateDateColumn()
    created_at!: Date;

}
