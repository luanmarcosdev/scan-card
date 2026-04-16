import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity('expense_categories')
export class ExpenseCategory {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'user_id', length: 36 })
    user_id!: string;

    @Column({ length: 50 })
    category!: string;

    @Column({ type: 'varchar', length: 50, nullable: true, default: null })
    description!: string | null;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn({ nullable: true, default: null })
    updated_at!: Date | null;

    @DeleteDateColumn({ nullable: true, default: null })
    deleted_at!: Date | null;

}
