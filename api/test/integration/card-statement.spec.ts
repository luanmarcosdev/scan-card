import request from 'supertest';
import { app } from '../../src/app';
import { initDB, closeDB, cleanupUser, cleanupCard, forceStatementStatus } from './helpers/db';
import { createUserAndGetToken } from './helpers/auth';

const TEST_EMAIL = 'card_statement_test@integration.test';

// minimal buffer — service validates only extension, not content
const FAKE_IMAGE = Buffer.from('fake-image-content');

let token: string;
let cleanup: () => Promise<void>;
let cardId: string;

beforeAll(async () => {
    await initDB();
    ({ token, cleanup } = await createUserAndGetToken(TEST_EMAIL));

    const cardRes = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${token}`)
        .send({ last_numbers: '4321', name: 'Test Card' });
    cardId = cardRes.body.data.id;
});

afterAll(async () => {
    await cleanupCard(cardId);
    await cleanup();
    await closeDB();
});

describe('POST /api/cards/:cardId/statements', () => {
    let createdId: string;

    afterEach(async () => {
        if (createdId) {
            await forceStatementStatus(createdId, 4);
            await request(app)
                .delete(`/api/cards/${cardId}/statements/${createdId}`)
                .set('Authorization', `Bearer ${token}`);
            createdId = '';
        }
    });

    it('should create a statement and return 202', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`)
            .field('year_reference', '2024')
            .field('month_reference', '3')
            .attach('images', FAKE_IMAGE, 'statement.jpg');

        expect(res.status).toBe(202);
        expect(res.body.data.card_id).toBe(cardId);
        expect(res.body.data.year_reference).toBe(2024);
        expect(res.body.data.month_reference).toBe(3);
        expect(res.body.data.status_id).toBe(2);

        createdId = res.body.data.id;
    });

    it('should create a statement with optional total', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`)
            .field('year_reference', '2024')
            .field('month_reference', '4')
            .field('total', '1500.00')
            .attach('images', FAKE_IMAGE, 'statement.jpg');

        expect(res.status).toBe(202);
        expect(res.body.data.total).toBe(1500);

        createdId = res.body.data.id;
    });

    it('should return 400 when no image is provided', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`)
            .field('year_reference', '2024')
            .field('month_reference', '5');

        expect(res.status).toBe(400);
    });

    it('should return 400 for invalid file type', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`)
            .field('year_reference', '2024')
            .field('month_reference', '6')
            .attach('images', FAKE_IMAGE, 'statement.pdf');

        expect(res.status).toBe(400);
    });

    it('should return 400 for invalid month_reference', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`)
            .field('year_reference', '2024')
            .field('month_reference', '13')
            .attach('images', FAKE_IMAGE, 'statement.jpg');

        expect(res.status).toBe(400);
    });

    it('should return 400 for missing year_reference', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`)
            .field('month_reference', '3')
            .attach('images', FAKE_IMAGE, 'statement.jpg');

        expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent cardId', async () => {
        const res = await request(app)
            .post('/api/cards/00000000-0000-0000-0000-000000000000/statements')
            .set('Authorization', `Bearer ${token}`)
            .field('year_reference', '2024')
            .field('month_reference', '3')
            .attach('images', FAKE_IMAGE, 'statement.jpg');

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .field('year_reference', '2024')
            .field('month_reference', '3')
            .attach('images', FAKE_IMAGE, 'statement.jpg');

        expect(res.status).toBe(401);
    });
});

describe('GET /api/cards/:cardId/statements', () => {
    it('should return list of statements', async () => {
        const res = await request(app)
            .get(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without token', async () => {
        const res = await request(app).get(`/api/cards/${cardId}/statements`);
        expect(res.status).toBe(401);
    });
});

describe('GET /api/cards/:cardId/statements/:id', () => {
    let statementId: string;

    beforeAll(async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`)
            .field('year_reference', '2024')
            .field('month_reference', '7')
            .attach('images', FAKE_IMAGE, 'statement.jpg');
        statementId = res.body.data.id;
    });

    afterAll(async () => {
        await forceStatementStatus(statementId, 4);
        await request(app)
            .delete(`/api/cards/${cardId}/statements/${statementId}`)
            .set('Authorization', `Bearer ${token}`);
    });

    it('should return a statement by id', async () => {
        const res = await request(app)
            .get(`/api/cards/${cardId}/statements/${statementId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(statementId);
        expect(res.body.data.month_reference).toBe(7);
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .get(`/api/cards/${cardId}/statements/00000000-0000-0000-0000-000000000000`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app).get(`/api/cards/${cardId}/statements/${statementId}`);
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/cards/:cardId/statements/:id', () => {
    let statementId: string;

    beforeAll(async () => {
        const res = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`)
            .field('year_reference', '2024')
            .field('month_reference', '8')
            .attach('images', FAKE_IMAGE, 'statement.jpg');
        statementId = res.body.data.id;
    });

    afterAll(async () => {
        await forceStatementStatus(statementId, 4);
        await request(app)
            .delete(`/api/cards/${cardId}/statements/${statementId}`)
            .set('Authorization', `Bearer ${token}`);
    });

    it('should update total', async () => {
        const res = await request(app)
            .put(`/api/cards/${cardId}/statements/${statementId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ total: 2500 });

        expect(res.status).toBe(200);
        expect(res.body.data.total).toBe(2500);
    });

    it('should return 400 when no data is provided', async () => {
        const res = await request(app)
            .put(`/api/cards/${cardId}/statements/${statementId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .put(`/api/cards/${cardId}/statements/00000000-0000-0000-0000-000000000000`)
            .set('Authorization', `Bearer ${token}`)
            .send({ total: 100 });

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .put(`/api/cards/${cardId}/statements/${statementId}`)
            .send({ total: 100 });

        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/cards/:cardId/statements/:id', () => {
    it('should delete a statement with deletable status', async () => {
        const created = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`)
            .field('year_reference', '2024')
            .field('month_reference', '9')
            .attach('images', FAKE_IMAGE, 'statement.jpg');

        const statementId = created.body.data.id;
        await forceStatementStatus(statementId, 4);

        const res = await request(app)
            .delete(`/api/cards/${cardId}/statements/${statementId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();
    });

    it('should return 409 when statement is being processed (status=2)', async () => {
        const created = await request(app)
            .post(`/api/cards/${cardId}/statements`)
            .set('Authorization', `Bearer ${token}`)
            .field('year_reference', '2024')
            .field('month_reference', '10')
            .attach('images', FAKE_IMAGE, 'statement.jpg');

        const statementId = created.body.data.id;

        const res = await request(app)
            .delete(`/api/cards/${cardId}/statements/${statementId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(409);

        await forceStatementStatus(statementId, 4);
        await request(app)
            .delete(`/api/cards/${cardId}/statements/${statementId}`)
            .set('Authorization', `Bearer ${token}`);
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .delete(`/api/cards/${cardId}/statements/00000000-0000-0000-0000-000000000000`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .delete(`/api/cards/${cardId}/statements/00000000-0000-0000-0000-000000000000`);

        expect(res.status).toBe(401);
    });
});
