import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateProcessingStatus1776556800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'processing_status',
            columns: [
                {
                    name: 'id',
                    type: 'int',
                    isPrimary: true,
                },
                {
                    name: 'status',
                    type: 'varchar',
                    length: '50',
                    isNullable: false,
                },
            ],
        }), true);

        await queryRunner.query(`
            INSERT INTO processing_status (id, status) VALUES
            (1, 'pending'),
            (2, 'sent'),
            (3, 'processing'),
            (4, 'success'),
            (5, 'retry'),
            (6, 'dlq'),
            (7, 'needs_review')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('processing_status', true);
    }

}
