import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 255 })
    name!: string;

    @Column({ unique: true, length: 255 })
    email!: string;

    @Index()
    @Column({ length: 11 })
    document!: string;

    @Column({ length: 60 })
    password!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null, transformer: { to: (v) => v, from: (v) => v !== null ? parseFloat(v) : null } })
    salary!: number | null;

    @Column({ length: 20, nullable: true })
    phone!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn({ nullable: true, default: null })
    updated_at!: Date | null;

    @DeleteDateColumn({ nullable: true, default: null })
    deleted_at!: Date | null;

}
