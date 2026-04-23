import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity('card_transactions')
export class CardTransaction {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'user_id', length: 36 })
    user_id!: string;

    @Index()
    @Column({ name: 'card_statement_id', length: 36 })
    card_statement_id!: string;

    @Column({ name: 'expense_category_id', length: 36 })
    expense_category_id!: string;

    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    merchant!: string | null;

    @Column({ name: 'transaction_date', type: 'date', nullable: true, default: null })
    transaction_date!: Date | null;

    @Column({ type: 'int', default: 1 })
    parcels!: number;

    @Column({ name: 'current_parcel', type: 'int', default: 1 })
    current_parcel!: number;

    @Column({ name: 'parcel_value', type: 'decimal', precision: 10, scale: 2, nullable: true, default: null, transformer: { to: (v) => v, from: (v) => v !== null ? parseFloat(v) : null } })
    parcel_value!: number | null;

    @Column({ name: 'total_value', type: 'decimal', precision: 10, scale: 2, transformer: { to: (v) => v, from: (v) => v !== null ? parseFloat(v) : null } })
    total_value!: number;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn({ nullable: true, default: null })
    updated_at!: Date | null;

    @DeleteDateColumn({ nullable: true, default: null })
    deleted_at!: Date | null;

}
