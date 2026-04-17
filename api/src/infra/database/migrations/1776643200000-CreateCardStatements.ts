import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateCardStatements1776643200000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'card_statements',
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
                    name: 'card_id',
                    type: 'varchar',
                    length: '36',
                    isNullable: false,
                },
                {
                    name: 'user_id',
                    type: 'varchar',
                    length: '36',
                    isNullable: false,
                },
                {
                    name: 'status_id',
                    type: 'int',
                    isNullable: false,
                    default: 1,
                },
                {
                    name: 'year_reference',
                    type: 'int',
                    isNullable: false,
                },
                {
                    name: 'month_reference',
                    type: 'int',
                    isNullable: false,
                },
                {
                    name: 'total',
                    type: 'decimal',
                    precision: 10,
                    scale: 2,
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'created_at',
                    type: 'datetime',
                    isNullable: false,
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updated_at',
                    type: 'datetime',
                    isNullable: true,
                    default: null,
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'deleted_at',
                    type: 'datetime',
                    isNullable: true,
                    default: null,
                },
            ],
        }), true);

        await queryRunner.createIndex('card_statements', new TableIndex({
            name: 'IDX_CARD_STATEMENTS_CARD_ID',
            columnNames: ['card_id'],
        }));

        await queryRunner.createIndex('card_statements', new TableIndex({
            name: 'IDX_CARD_STATEMENTS_USER_ID',
            columnNames: ['user_id'],
        }));

        await queryRunner.createForeignKey('card_statements', new TableForeignKey({
            name: 'FK_CARD_STATEMENTS_CARD_ID',
            columnNames: ['card_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'cards',
            onDelete: 'CASCADE',
        }));

        await queryRunner.createForeignKey('card_statements', new TableForeignKey({
            name: 'FK_CARD_STATEMENTS_USER_ID',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
        }));

        await queryRunner.createForeignKey('card_statements', new TableForeignKey({
            name: 'FK_CARD_STATEMENTS_STATUS_ID',
            columnNames: ['status_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'processing_status',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('card_statements', true);
    }

}
