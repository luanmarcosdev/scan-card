import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateCardStatementImages1776729600000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'card_statement_images',
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
                    name: 'card_statement_id',
                    type: 'varchar',
                    length: '36',
                    isNullable: false,
                },
                {
                    name: 'image_path',
                    type: 'varchar',
                    length: '255',
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

        await queryRunner.createIndex('card_statement_images', new TableIndex({
            name: 'IDX_CARD_STATEMENT_IMAGES_STATEMENT_ID',
            columnNames: ['card_statement_id'],
        }));

        await queryRunner.createForeignKey('card_statement_images', new TableForeignKey({
            name: 'FK_CARD_STATEMENT_IMAGES_STATEMENT_ID',
            columnNames: ['card_statement_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'card_statements',
            onDelete: 'CASCADE',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('card_statement_images', true);
    }

}
