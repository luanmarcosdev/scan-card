import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('jobs')
export class Job {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'statement_id', type: 'varchar', length: 36, nullable: true, default: null })
    statement_id!: string | null;

    @Column({ length: 100 })
    exchange!: string;

    @Column({ length: 100 })
    routing_key!: string;

    @Column({ type: 'json' })
    payload!: object;

    @Column({ name: 'status_id', type: 'int', default: 2 })
    status_id!: number;

    @Column({ type: 'int', default: 0 })
    retries!: number;

    @CreateDateColumn()
    created_at!: Date;

}
