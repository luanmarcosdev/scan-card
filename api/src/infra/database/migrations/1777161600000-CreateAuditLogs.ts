import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateAuditLogs1777161600000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'audit_logs',
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
                    isNullable: false,
                },
                {
                    name: 'input_tokens',
                    type: 'int',
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'output_tokens',
                    type: 'int',
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'raw_response',
                    type: 'json',
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'transactions_extracted',
                    type: 'int',
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'status_id',
                    type: 'int',
                    isNullable: false,
                },
                {
                    name: 'created_at',
                    type: 'datetime',
                    isNullable: false,
                    default: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);

        await queryRunner.createIndex('audit_logs', new TableIndex({
            name: 'IDX_AUDIT_LOGS_STATEMENT_ID',
            columnNames: ['statement_id'],
        }));

        await queryRunner.createForeignKey('audit_logs', new TableForeignKey({
            name: 'FK_AUDIT_LOGS_STATEMENT_ID',
            columnNames: ['statement_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'card_statements',
            onDelete: 'CASCADE',
        }));

        await queryRunner.createForeignKey('audit_logs', new TableForeignKey({
            name: 'FK_AUDIT_LOGS_STATUS_ID',
            columnNames: ['status_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'processing_status',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('audit_logs', true);
    }

}
