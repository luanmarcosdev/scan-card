import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvalidImageProcessingStatus1777248000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO processing_status (id, status) VALUES (9, 'invalid_image')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM processing_status WHERE id = 9`);
    }

}
