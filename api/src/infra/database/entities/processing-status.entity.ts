import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('processing_status')
export class ProcessingStatus {

    @PrimaryColumn({ type: 'int' })
    id!: number;

    @Column({ length: 50 })
    status!: string;

}
