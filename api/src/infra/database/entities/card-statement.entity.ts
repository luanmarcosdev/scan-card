import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity('card_statements')
export class CardStatement {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'card_id', length: 36 })
    card_id!: string;

    @Index()
    @Column({ name: 'user_id', length: 36 })
    user_id!: string;

    @Column({ name: 'status_id', type: 'int', default: 1 })
    status_id!: number;

    @Column({ name: 'year_reference', type: 'int' })
    year_reference!: number;

    @Column({ name: 'month_reference', type: 'int' })
    month_reference!: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        default: null,
        transformer: { to: (v) => v, from: (v) => v !== null ? parseFloat(v) : null },
    })
    total!: number | null;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn({ nullable: true, default: null })
    updated_at!: Date | null;

    @DeleteDateColumn({ nullable: true, default: null })
    deleted_at!: Date | null;

}
