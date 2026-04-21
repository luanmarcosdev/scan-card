import { Column, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('fail_jobs')
export class FailJob {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'job_id', length: 36 })
    job_id!: string;

    @Column({ type: 'text', nullable: true, default: null })
    error_message!: string | null;

    @Column({ name: 'failed_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    failed_at!: Date;

    @DeleteDateColumn({ nullable: true, default: null })
    deleted_at!: Date | null;

}
