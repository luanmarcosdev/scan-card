import { AppDataSource } from '../../../src/infra/database/data-source';
import { connectRedis, redisClient } from '../../../src/infra/cache/redis';

export async function initDB() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
    if (!redisClient.isOpen) {
        await connectRedis();
    }
}

export async function closeDB() {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
}

export async function cleanupUser(email: string) {
    await AppDataSource.query(
        `DELETE FROM expense_categories WHERE user_id = (SELECT id FROM users WHERE email = ?)`,
        [email]
    );
    await AppDataSource.query(`DELETE FROM users WHERE email = ?`, [email]);
}

export async function cleanupCard(cardId: string) {
    await AppDataSource.query(
        `DELETE FROM card_statement_images WHERE card_statement_id IN (SELECT id FROM card_statements WHERE card_id = ?)`,
        [cardId]
    );
    await AppDataSource.query(`DELETE FROM card_transactions WHERE card_statement_id IN (SELECT id FROM card_statements WHERE card_id = ?)`, [cardId]);
    await AppDataSource.query(`DELETE FROM card_statements WHERE card_id = ?`, [cardId]);
    await AppDataSource.query(`DELETE FROM cards WHERE id = ?`, [cardId]);
}

export async function forceStatementStatus(statementId: string, statusId: number) {
    await AppDataSource.query(
        `UPDATE card_statements SET status_id = ? WHERE id = ?`,
        [statusId, statementId]
    );
}
