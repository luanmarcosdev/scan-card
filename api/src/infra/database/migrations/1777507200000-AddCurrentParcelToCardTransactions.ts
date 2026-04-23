import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrentParcelToCardTransactions1777507200000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE card_transactions
            ADD COLUMN current_parcel INT NOT NULL DEFAULT 1 AFTER parcels
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE card_transactions DROP COLUMN current_parcel`);
    }

}
