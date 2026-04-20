import request from 'supertest';
import { app } from '../../src/app';
import { initDB, closeDB, cleanupUser } from './helpers/db';

const TEST_EMAIL = 'auth_test@integration.test';

const VALID_PAYLOAD = {
    name: 'Integration Test',
    email: TEST_EMAIL,
    document: '52998224725',
    password: 'Password1',
    phone: '11999999999',
};

beforeAll(async () => {
    await initDB();
});

afterAll(async () => {
    await cleanupUser(TEST_EMAIL);
    await closeDB();
});

describe('POST /api/auth/register', () => {
    afterEach(async () => {
        await cleanupUser(TEST_EMAIL);
    });

    it('should register a new user and return 201', async () => {
        const res = await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

        expect(res.status).toBe(201);
        expect(res.body.data.email).toBe(TEST_EMAIL);
        expect(res.body.data).not.toHaveProperty('password');
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).toHaveProperty('created_at');
    });

    it('should return 409 when email already exists', async () => {
        await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

        const res = await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

        expect(res.status).toBe(409);
    });

    it('should return 400 for invalid email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...VALID_PAYLOAD, email: 'not-an-email' });

        expect(res.status).toBe(400);
    });

    it('should return 400 for invalid CPF', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...VALID_PAYLOAD, document: '000.000.000-00' });

        expect(res.status).toBe(400);
    });

    it('should return 400 for weak password', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...VALID_PAYLOAD, password: '123456' });

        expect(res.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: TEST_EMAIL });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/auth/login', () => {
    beforeAll(async () => {
        await request(app).post('/api/auth/register').send(VALID_PAYLOAD);
    });

    afterAll(async () => {
        await cleanupUser(TEST_EMAIL);
    });

    it('should login and return a token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL, password: 'Password1' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.tokenType).toBe('Bearer');
        expect(res.body.expiresIn).toBe('2h');
    });

    it('should return 401 for wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL, password: 'WrongPassword1' });

        expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@integration.test', password: 'Password1' });

        expect(res.status).toBe(401);
    });

    it('should return 400 for invalid body', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'not-an-email' });

        expect(res.status).toBe(400);
    });
});
