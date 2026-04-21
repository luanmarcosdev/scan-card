import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('audit_logs')
export class AuditLog {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'statement_id', length: 36 })
    statement_id!: string;

    @Column({ name: 'input_tokens', type: 'int', nullable: true, default: null })
    input_tokens!: number | null;

    @Column({ name: 'output_tokens', type: 'int', nullable: true, default: null })
    output_tokens!: number | null;

    @Column({ name: 'raw_response', type: 'json', nullable: true, default: null })
    raw_response!: object | null;

    @Column({ name: 'transactions_extracted', type: 'int', nullable: true, default: null })
    transactions_extracted!: number | null;

    @Column({ name: 'status_id', type: 'int' })
    status_id!: number;

    @CreateDateColumn()
    created_at!: Date;

}
