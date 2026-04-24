import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIpAddressToCardStatements1777593600000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE card_statements
            ADD COLUMN ip_address VARCHAR(45) NULL DEFAULT NULL AFTER total
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE card_statements DROP COLUMN ip_address`);
    }

}
