import request from 'supertest';
import { app } from '../../src/app';
import { initDB, closeDB, cleanupUser } from './helpers/db';
import { createUserAndGetToken } from './helpers/auth';

const TEST_EMAIL = 'expense_category_test@integration.test';

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

describe('GET /api/expense-categories', () => {
    it('should return list of categories (includes defaults created on register)', async () => {
        const res = await request(app)
            .get('/api/expense-categories')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return 401 without token', async () => {
        const res = await request(app).get('/api/expense-categories');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/expense-categories', () => {
    let createdId: string;

    afterEach(async () => {
        if (createdId) {
            await request(app)
                .delete(`/api/expense-categories/${createdId}`)
                .set('Authorization', `Bearer ${token}`);
            createdId = '';
        }
    });

    it('should create a category and return 201', async () => {
        const res = await request(app)
            .post('/api/expense-categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Transport', description: 'Bus and taxi' });

        expect(res.status).toBe(201);
        expect(res.body.data.category).toBe('Transport');
        expect(res.body.data.description).toBe('Bus and taxi');
        expect(res.body.data).toHaveProperty('id');

        createdId = res.body.data.id;
    });

    it('should create a category without description', async () => {
        const res = await request(app)
            .post('/api/expense-categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Health' });

        expect(res.status).toBe(201);
        expect(res.body.data.description).toBeNull();

        createdId = res.body.data.id;
    });

    it('should return 400 for category shorter than 2 characters', async () => {
        const res = await request(app)
            .post('/api/expense-categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'A' });

        expect(res.status).toBe(400);
    });

    it('should return 400 for missing category field', async () => {
        const res = await request(app)
            .post('/api/expense-categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ description: 'No category name' });

        expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .post('/api/expense-categories')
            .send({ category: 'Transport' });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/expense-categories/:id', () => {
    let createdId: string;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/expense-categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Education' });
        createdId = res.body.data.id;
    });

    afterAll(async () => {
        await request(app)
            .delete(`/api/expense-categories/${createdId}`)
            .set('Authorization', `Bearer ${token}`);
    });

    it('should return a category by id', async () => {
        const res = await request(app)
            .get(`/api/expense-categories/${createdId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(createdId);
        expect(res.body.data.category).toBe('Education');
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .get('/api/expense-categories/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app).get(`/api/expense-categories/${createdId}`);
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/expense-categories/:id', () => {
    let createdId: string;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/expense-categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Leisure' });
        createdId = res.body.data.id;
    });

    afterAll(async () => {
        await request(app)
            .delete(`/api/expense-categories/${createdId}`)
            .set('Authorization', `Bearer ${token}`);
    });

    it('should update category name', async () => {
        const res = await request(app)
            .put(`/api/expense-categories/${createdId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Entertainment' });

        expect(res.status).toBe(200);
        expect(res.body.data.category).toBe('Entertainment');
    });

    it('should update description', async () => {
        const res = await request(app)
            .put(`/api/expense-categories/${createdId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ description: 'Movies and games' });

        expect(res.status).toBe(200);
        expect(res.body.data.description).toBe('Movies and games');
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .put('/api/expense-categories/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Test' });

        expect(res.status).toBe(404);
    });

    it('should return 400 for category shorter than 2 characters', async () => {
        const res = await request(app)
            .put(`/api/expense-categories/${createdId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'A' });

        expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .put(`/api/expense-categories/${createdId}`)
            .send({ category: 'Test' });

        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/expense-categories/:id', () => {
    it('should delete a category', async () => {
        const created = await request(app)
            .post('/api/expense-categories')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'Temporary' });

        const res = await request(app)
            .delete(`/api/expense-categories/${created.body.data.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();
    });

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .delete('/api/expense-categories/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .delete('/api/expense-categories/00000000-0000-0000-0000-000000000000');

        expect(res.status).toBe(401);
    });
});
