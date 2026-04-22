import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateViewTransactionsDetailed1777420800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE VIEW vw_transactions_detailed AS
            SELECT
                u.id AS user_id,
                u.name AS user_name,
                u.email AS email,
                c.id AS card_id,
                c.last_numbers AS last_numbers,
                c.name AS name,
                cs.id AS statement_id,
                cs.year_reference AS year_reference,
                cs.month_reference AS month_reference,
                cs.total AS total,
                cs.status_id AS status_id,
                ps.status AS status,
                ct.id AS transaction_id,
                ct.merchant AS merchant,
                ec.category AS category,
                ct.parcels AS parcels,
                ct.parcel_value AS parcel_value,
                ct.total_value AS total_value,
                ct.transaction_date AS transaction_date
            FROM users u
            JOIN cards c ON c.user_id = u.id
            JOIN card_statements cs ON cs.card_id = c.id AND cs.user_id = u.id
            JOIN processing_status ps ON cs.status_id = ps.id
            JOIN card_transactions ct ON ct.user_id = u.id AND ct.card_statement_id = cs.id
            JOIN expense_categories ec ON ct.expense_category_id = ec.id
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW IF EXISTS vw_transactions_detailed`);
    }

}
