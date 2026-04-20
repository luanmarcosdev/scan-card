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
