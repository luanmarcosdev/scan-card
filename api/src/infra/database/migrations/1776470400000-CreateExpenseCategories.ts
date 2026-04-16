import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateExpenseCategories1776470400000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'expense_categories',
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
                    name: 'category',
                    type: 'varchar',
                    length: '50',
                    isNullable: false,
                },
                {
                    name: 'description',
                    type: 'varchar',
                    length: '50',
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

        await queryRunner.createIndex('expense_categories', new TableIndex({
            name: 'IDX_EXPENSE_CATEGORIES_USER_ID',
            columnNames: ['user_id'],
        }));

        await queryRunner.createForeignKey('expense_categories', new TableForeignKey({
            name: 'FK_EXPENSE_CATEGORIES_USER_ID',
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('expense_categories', true);
    }

}
