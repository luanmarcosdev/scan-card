import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateJobs1776988800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'jobs',
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
                    name: 'statement_id',
                    type: 'varchar',
                    length: '36',
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'exchange',
                    type: 'varchar',
                    length: '100',
                    isNullable: false,
                },
                {
                    name: 'routing_key',
                    type: 'varchar',
                    length: '100',
                    isNullable: false,
                },
                {
                    name: 'payload',
                    type: 'json',
                    isNullable: false,
                },
                {
                    name: 'status_id',
                    type: 'int',
                    isNullable: false,
                    default: 2,
                },
                {
                    name: 'retries',
                    type: 'int',
                    isNullable: false,
                    default: 0,
                },
                {
                    name: 'created_at',
                    type: 'datetime',
                    isNullable: false,
                    default: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);

        await queryRunner.createIndex('jobs', new TableIndex({
            name: 'IDX_JOBS_STATEMENT_ID',
            columnNames: ['statement_id'],
        }));

        await queryRunner.createForeignKey('jobs', new TableForeignKey({
            name: 'FK_JOBS_STATEMENT_ID',
            columnNames: ['statement_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'card_statements',
            onDelete: 'SET NULL',
        }));

        await queryRunner.createForeignKey('jobs', new TableForeignKey({
            name: 'FK_JOBS_STATUS_ID',
            columnNames: ['status_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'processing_status',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('jobs', true);
    }

}
