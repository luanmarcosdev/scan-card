import { MigrationInterface, QueryRunner } from "typeorm";

export class AddErrorProcessingStatus1776902400000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO processing_status (id, status) VALUES (8, 'error')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM processing_status WHERE id = 8`);
    }

}
