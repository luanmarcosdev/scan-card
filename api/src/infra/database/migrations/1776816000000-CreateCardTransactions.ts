import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateCardTransactions1776816000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'card_transactions',
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
                    name: 'user_id',
                    type: 'varchar',
                    length: '36',
                    isNullable: false,
                },
                {
                    name: 'card_statement_id',
                    type: 'varchar',
                    length: '36',
                    isNullable: false,
                },
                {
                    name: 'expense_category_id',
                    type: 'varchar',
                    length: '36',
                    isNullable: false,
                },
                {
                    name: 'merchant',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'transaction_date',
                    type: 'date',
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'parcels',
                    type: 'int',
                    isNullable: false,
                    default: 1,
                },
                {
                    name: 'parcel_value',
                    type: 'decimal',
                    precision: 10,
                    scale: 2,
                    isNullable: true,
                    default: null,
                },
                {
                    name: 'total_value',
                    type: 'decimal',
                    precision: 10,
                    scale: 2,
                    isNullable: false,
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

        await queryRunner.createIndex('card_transactions', new TableIndex({
            name: 'IDX_CARD_TRANSACTIONS_USER_ID',
            columnNames: ['user_id'],
        }));

        await queryRunner.createIndex('card_transactions', new TableIndex({
            name: 'IDX_CARD_TRANSACTIONS_STATEMENT_ID',
            columnNames: ['card_statement_id'],
        }));

        await queryRunner.createForeignKey('card_transactions', new TableForeignKey({
            name: 'FK_CARD_TRANSACTIONS_USER_ID',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
        }));

        await queryRunner.createForeignKey('card_transactions', new TableForeignKey({
            name: 'FK_CARD_TRANSACTIONS_STATEMENT_ID',
            columnNames: ['card_statement_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'card_statements',
            onDelete: 'CASCADE',
        }));

        await queryRunner.createForeignKey('card_transactions', new TableForeignKey({
            name: 'FK_CARD_TRANSACTIONS_CATEGORY_ID',
            columnNames: ['expense_category_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'expense_categories',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('card_transactions', true);
    }

}
