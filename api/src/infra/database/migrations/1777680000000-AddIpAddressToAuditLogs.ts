import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIpAddressToAuditLogs1777680000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE audit_logs
            ADD COLUMN ip_address VARCHAR(45) NULL DEFAULT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE audit_logs DROP COLUMN ip_address`);
    }

}
