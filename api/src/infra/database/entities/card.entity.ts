import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity('cards')
export class Card {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'user_id', length: 36 })
    user_id!: string;

    @Column({ name: 'last_numbers', length: 4 })
    last_numbers!: string;

    @Column({ type: 'varchar', length: 50, nullable: true, default: null })
    name!: string | null;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn({ nullable: true, default: null })
    updated_at!: Date | null;

    @DeleteDateColumn({ nullable: true, default: null })
    deleted_at!: Date | null;

}
