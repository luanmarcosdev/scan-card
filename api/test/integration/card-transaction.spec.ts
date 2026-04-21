import request from 'supertest';
import { app } from '../../src/app';
import { AppDataSource } from '../../src/infra/database/data-source';
import { initDB, closeDB, cleanupCard, forceStatementStatus } from './helpers/db';
import { createUserAndGetToken } from './helpers/auth';

const TEST_EMAIL = 'card_transaction_test@integration.test';
const FAKE_IMAGE = Buffer.from('fake-image-content');

let token: string;
let cleanup: () => Promise<void>;
let cardId: string;
let statementId: string;
let expenseCategoryId: string;

async function getDefaultExpenseCategoryId(userToken: string): Promise<string> {
    const res = await request(app)
        .get('/api/expense-categories')
        .set('Authorization', `Bearer ${userToken}`);
    return res.body.data[0].id;
}

async function createStatement(month: number): Promise<string> {
    const res = await request(app)
        .post(`/api/cards/${cardId}/statements`)
        .set('Authorization', `Bearer ${token}`)
        .field('year_reference', '2024')
        .field('month_reference', String(month))
        .attach('images', FAKE_IMAGE, 'statement.jpg');
    return res.body.data.id;
}

beforeAll(async () => {
    await initDB();
    ({ token, cleanup } = await createUserAndGetToken(TEST_EMAIL));

    const cardRes = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${token}`)
        .send({ last_numbers: '9999', name: 'Transaction Test Card' });
    cardId = cardRes.body.data.id;

    statementId = await createStatement(1);
    expenseCategoryId = await getDefaultExpenseCategoryId(token);
});

afterAll(async () => {
    await AppDataSource.query(`DELETE FROM card_transactions WHERE card_statement_id = ?`, [statementId]);
    await forceStatementStatus(statementId, 4);
    await cleanupCard(cardId);
    await cleanup();
    await closeDB();
});

describe('POST /api/cards/:cardId/statements/:statementId/transactions', () => {
    let createdId: string;

    afterEach(async () => {
        if (createdId) {
            await request(app)
                .delete(`/api/cards/${cardId}/statements/${statementId}/transactions/${createdId}`)
                .set('Authorization', `Bearer ${token}`);
            createdId = '';
        }
    });

    it('should create a transaction and return 201', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                expense_category_id: expenseCategoryId,
                total_value: 150.00,
                merchant: 'Supermarket',
                transaction_date: '2024-01-15',
            });

        expect(res.status).toBe(201);
        expect(res.body.data.total_value).toBe(150);
        expect(res.body.data.merchant).toBe('Supermarket');
        expect(res.body.data.card_statement_id).toBe(statementId);
        expect(res.body.data.expense_category_id).toBe(expenseCategoryId);

        createdId = res.body.data.id;
    });

    it('should create a transaction with minimal fields', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                expense_category_id: expenseCategoryId,
                total_value: 50,
            });

        expect(res.status).toBe(201);
        expect(res.body.data.total_value).toBe(50);
        expect(res.body.data.merchant).toBeNull();

        createdId = res.body.data.id;
    });

    it('should return 400 when expense_category_id is missing', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .set('Authorization', `Bearer ${token}`)
            .send({ total_value: 100 });

        expect(res.status).toBe(400);
    });

    it('should return 400 when total_value is missing', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .set('Authorization', `Bearer ${token}`)
            .send({ expense_category_id: expenseCategoryId });

        expect(res.status).toBe(400);
    });

    it('should return 400 for invalid transaction_date format', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                expense_category_id: expenseCategoryId,
                total_value: 100,
                transaction_date: '2024-01-01T00:00:00.000Z',
            });

        expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent expense_category_id', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                expense_category_id: '00000000-0000-0000-0000-000000000000',
                total_value: 100,
            });

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .send({ expense_category_id: expenseCategoryId, total_value: 100 });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/cards/:cardId/statements/:statementId/transactions', () => {
    it('should return list of transactions', async () => {
        const res = await request(app)
            .get(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .get(`/api/cards/${cardId}/statements/${statementId}/transactions`);

        expect(res.status).toBe(401);
    });
});

describe('GET /api/cards/:cardId/statements/:statementId/transactions/:id', () => {
    let transactionId: string;

    beforeAll(async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .set('Authorization', `Bearer ${token}`)
            .send({ expense_category_id: expenseCategoryId, total_value: 75, merchant: 'Coffee Shop' });
        transactionId = res.body.data.id;
    });

    afterAll(async () => {
        await request(app)
            .delete(`/api/cards/${cardId}/statements/${statementId}/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${token}`);
    });

    it('should return a transaction by id', async () => {
        const res = await request(app)
            .get(`/api/cards/${cardId}/statements/${statementId}/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(transactionId);
        expect(res.body.data.merchant).toBe('Coffee Shop');
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .get(`/api/cards/${cardId}/statements/${statementId}/transactions/00000000-0000-0000-0000-000000000000`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .get(`/api/cards/${cardId}/statements/${statementId}/transactions/${transactionId}`);

        expect(res.status).toBe(401);
    });
});

describe('PUT /api/cards/:cardId/statements/:statementId/transactions/:id', () => {
    let transactionId: string;

    beforeAll(async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .set('Authorization', `Bearer ${token}`)
            .send({ expense_category_id: expenseCategoryId, total_value: 200, merchant: 'Restaurant' });
        transactionId = res.body.data.id;
    });

    afterAll(async () => {
        await request(app)
            .delete(`/api/cards/${cardId}/statements/${statementId}/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${token}`);
    });

    it('should update total_value', async () => {
        const res = await request(app)
            .put(`/api/cards/${cardId}/statements/${statementId}/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ total_value: 250 });

        expect(res.status).toBe(200);
        expect(res.body.data.total_value).toBe(250);
    });

    it('should update merchant', async () => {
        const res = await request(app)
            .put(`/api/cards/${cardId}/statements/${statementId}/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ merchant: 'Updated Restaurant' });

        expect(res.status).toBe(200);
        expect(res.body.data.merchant).toBe('Updated Restaurant');
    });

    it('should return 400 when no data is provided', async () => {
        const res = await request(app)
            .put(`/api/cards/${cardId}/statements/${statementId}/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
    });

    it('should return 404 when updating expense_category_id to non-existent', async () => {
        const res = await request(app)
            .put(`/api/cards/${cardId}/statements/${statementId}/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ expense_category_id: '00000000-0000-0000-0000-000000000000' });

        expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .put(`/api/cards/${cardId}/statements/${statementId}/transactions/00000000-0000-0000-0000-000000000000`)
            .set('Authorization', `Bearer ${token}`)
            .send({ total_value: 100 });

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .put(`/api/cards/${cardId}/statements/${statementId}/transactions/${transactionId}`)
            .send({ total_value: 100 });

        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/cards/:cardId/statements/:statementId/transactions/:id', () => {
    it('should delete a transaction', async () => {
        const created = await request(app)
            .post(`/api/cards/${cardId}/statements/${statementId}/transactions`)
            .set('Authorization', `Bearer ${token}`)
            .send({ expense_category_id: expenseCategoryId, total_value: 30 });

        const transactionId = created.body.data.id;

        const res = await request(app)
            .delete(`/api/cards/${cardId}/statements/${statementId}/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .delete(`/api/cards/${cardId}/statements/${statementId}/transactions/00000000-0000-0000-0000-000000000000`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .delete(`/api/cards/${cardId}/statements/${statementId}/transactions/00000000-0000-0000-0000-000000000000`);

        expect(res.status).toBe(401);
    });
});
