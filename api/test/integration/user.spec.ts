import request from 'supertest';
import { app } from '../../src/app';
import { initDB, closeDB, cleanupUser } from './helpers/db';
import { registerAndLogin, DEFAULT_PASSWORD } from './helpers/auth';

const TEST_EMAIL = 'user_test@integration.test';

let token: string;

beforeAll(async () => {
    await initDB();
    token = await registerAndLogin(TEST_EMAIL);
});

afterAll(async () => {
    await cleanupUser(TEST_EMAIL);
    await closeDB();
});

describe('GET /api/users/me', () => {
    it('should return authenticated user data', async () => {
        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe(TEST_EMAIL);
        expect(res.body.data).not.toHaveProperty('password');
        expect(res.body.data).toHaveProperty('id');
    });

    it('should return 401 without token', async () => {
        const res = await request(app).get('/api/users/me');

        expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', 'Bearer invalidtoken');

        expect(res.status).toBe(401);
    });
});

describe('PUT /api/users/me', () => {
    it('should update user name', async () => {
        const res = await request(app)
            .put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated Name' });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('Updated Name');
    });

    it('should update user salary', async () => {
        const res = await request(app)
            .put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ salary: 5000 });

        expect(res.status).toBe(200);
        expect(res.body.data.salary).toBe(5000);
    });

    it('should return 400 for name shorter than 3 characters', async () => {
        const res = await request(app)
            .put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'AB' });

        expect(res.status).toBe(400);
    });

    it('should return 400 for weak password', async () => {
        const res = await request(app)
            .put('/api/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: '123456' });

        expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .put('/api/users/me')
            .send({ name: 'Updated Name' });

        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/users/me', () => {
    it('should return 401 without token', async () => {
        const res = await request(app).delete('/api/users/me');

        expect(res.status).toBe(401);
    });

    it('should delete authenticated user', async () => {
        const deleteEmail = 'user_delete_test@integration.test';
        const deleteToken = await registerAndLogin(deleteEmail);

        const res = await request(app)
            .delete('/api/users/me')
            .set('Authorization', `Bearer ${deleteToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeNull();

        await cleanupUser(deleteEmail);
    });

    it('should return 401 after deletion (token no longer valid for deleted user)', async () => {
        const deleteEmail = 'user_stale_token@integration.test';
        const deleteToken = await registerAndLogin(deleteEmail);

        await request(app)
            .delete('/api/users/me')
            .set('Authorization', `Bearer ${deleteToken}`);

        const res = await request(app)
            .get('/api/users/me')
            .set('Authorization', `Bearer ${deleteToken}`);

        expect(res.status).toBe(404);

        await cleanupUser(deleteEmail);
    });
});
