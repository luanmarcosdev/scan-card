import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateFailJobs1777075200000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'fail_jobs',
            columns: [
                {
                    name: 'id',
                    type: 'varchar',
                    length: '36',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: '(UUID())',
                },
                {
                    name: 'job_id',
                    type: 'varchar',
                    length: '36',
                    isNullable: false,
                },
                {
                    name: 'error_message',
                    type: 'text',
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'failed_at',
                    type: 'datetime',
                    isNullable: false,
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'deleted_at',
                    type: 'datetime',
                    isNullable: true,
                    default: null,
                },
            ],
        }), true);

        await queryRunner.createIndex('fail_jobs', new TableIndex({
            name: 'IDX_FAIL_JOBS_JOB_ID',
            columnNames: ['job_id'],
        }));

        await queryRunner.createForeignKey('fail_jobs', new TableForeignKey({
            name: 'FK_FAIL_JOBS_JOB_ID',
            columnNames: ['job_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'jobs',
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('fail_jobs', true);
    }

}
