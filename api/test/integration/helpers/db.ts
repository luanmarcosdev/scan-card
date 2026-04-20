import { AppDataSource } from '../../../src/infra/database/data-source';

export async function initDB() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
}

export async function closeDB() {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
}

export async function cleanupUser(email: string) {
    await AppDataSource.query(
        `DELETE FROM expense_categories WHERE user_id = (SELECT id FROM users WHERE email = ?)`,
        [email]
    );
    await AppDataSource.query(`DELETE FROM users WHERE email = ?`, [email]);
}
