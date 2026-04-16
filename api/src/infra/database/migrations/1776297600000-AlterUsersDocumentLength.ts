import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUsersDocumentLength1776297600000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE users SET document = REPLACE(REPLACE(document, '.', ''), '-', '')`);
        await queryRunner.query(`ALTER TABLE users MODIFY COLUMN document VARCHAR(11) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users MODIFY COLUMN document VARCHAR(50) NOT NULL`);
    }

}
