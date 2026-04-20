import request from 'supertest';
import { app } from '../../src/app';
import { initDB, closeDB, cleanupUser } from './helpers/db';
import { createUserAndGetToken } from './helpers/auth';

const TEST_EMAIL = 'card_test@integration.test';

let token: string;
let cleanup: () => Promise<void>;

beforeAll(async () => {
    await initDB();
    ({ token, cleanup } = await createUserAndGetToken(TEST_EMAIL));
});

afterAll(async () => {
    await cleanup();
    await closeDB();
});

describe('GET /api/cards', () => {
    it('should return empty list for new user', async () => {
        const res = await request(app)
            .get('/api/cards')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without token', async () => {
        const res = await request(app).get('/api/cards');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/cards', () => {
    let createdId: string;

    afterEach(async () => {
        if (createdId) {
            await request(app)
                .delete(`/api/cards/${createdId}`)
                .set('Authorization', `Bearer ${token}`);
            createdId = '';
        }
    });

    it('should create a card and return 201', async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${token}`)
            .send({ last_numbers: '1234', name: 'Nubank' });

        expect(res.status).toBe(201);
        expect(res.body.data.last_numbers).toBe('1234');
        expect(res.body.data.name).toBe('Nubank');
        expect(res.body.data).toHaveProperty('id');

        createdId = res.body.data.id;
    });

    it('should create a card without name', async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${token}`)
            .send({ last_numbers: '5678' });

        expect(res.status).toBe(201);
        expect(res.body.data.name).toBeNull();

        createdId = res.body.data.id;
    });

    it('should return 400 for last_numbers with less than 4 digits', async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${token}`)
            .send({ last_numbers: '123' });

        expect(res.status).toBe(400);
    });

    it('should return 400 for last_numbers with more than 4 digits', async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${token}`)
            .send({ last_numbers: '12345' });

        expect(res.status).toBe(400);
    });

    it('should return 400 for non-numeric last_numbers', async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${token}`)
            .send({ last_numbers: 'abcd' });

        expect(res.status).toBe(400);
    });

    it('should return 400 for missing last_numbers', async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'No number' });

        expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .post('/api/cards')
            .send({ last_numbers: '1234' });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/cards/:id', () => {
    let createdId: string;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${token}`)
            .send({ last_numbers: '9999', name: 'Inter' });
        createdId = res.body.data.id;
    });

    afterAll(async () => {
        await request(app)
            .delete(`/api/cards/${createdId}`)
            .set('Authorization', `Bearer ${token}`);
    });

    it('should return a card by id', async () => {
        const res = await request(app)
            .get(`/api/cards/${createdId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(createdId);
        expect(res.body.data.last_numbers).toBe('9999');
        expect(res.body.data.name).toBe('Inter');
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .get('/api/cards/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app).get(`/api/cards/${createdId}`);
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/cards/:id', () => {
    let createdId: string;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${token}`)
            .send({ last_numbers: '1111', name: 'Old Name' });
        createdId = res.body.data.id;
    });

    afterAll(async () => {
        await request(app)
            .delete(`/api/cards/${createdId}`)
            .set('Authorization', `Bearer ${token}`);
    });

    it('should update card name', async () => {
        const res = await request(app)
            .put(`/api/cards/${createdId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'New Name' });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('New Name');
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .put('/api/cards/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Test' });

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .put(`/api/cards/${createdId}`)
            .send({ name: 'Test' });

        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/cards/:id', () => {
    it('should delete a card', async () => {
        const created = await request(app)
            .post('/api/cards')
            .set('Authorization', `Bearer ${token}`)
            .send({ last_numbers: '0000' });

        const res = await request(app)
            .delete(`/api/cards/${created.body.data.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .delete('/api/cards/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .delete('/api/cards/00000000-0000-0000-0000-000000000000');

        expect(res.status).toBe(401);
    });
});
