import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUsersPasswordLength1776211200000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users MODIFY COLUMN password VARCHAR(60) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users MODIFY COLUMN password VARCHAR(20) NOT NULL`);
    }

}
