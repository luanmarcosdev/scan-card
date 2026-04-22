import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateViewCardsStatementDetailed1777334400000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE VIEW vw_cards_statement_detailed AS
            SELECT
                u.id AS user_id,
                c.id AS card_id,
                u.name AS user_name,
                c.last_numbers AS last_numbers,
                c.name AS name,
                cs.year_reference AS year_reference,
                cs.month_reference AS month_reference,
                cs.total AS total,
                cs.status_id AS status_id,
                ps.status AS status
            FROM users u
            JOIN cards c ON c.user_id = u.id
            JOIN card_statements cs ON cs.card_id = c.id AND cs.user_id = u.id
            JOIN processing_status ps ON cs.status_id = ps.id
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW IF EXISTS vw_cards_statement_detailed`);
    }

}
