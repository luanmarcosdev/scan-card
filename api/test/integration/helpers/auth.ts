import request from 'supertest';
import { app } from '../../../src/app';
import { cleanupUser } from './db';

export const DEFAULT_PASSWORD = 'Password1';

export async function registerAndLogin(email: string): Promise<string> {
    await request(app).post('/api/auth/register').send({
        name: 'Integration Test',
        email,
        document: '52998224725',
        password: DEFAULT_PASSWORD,
        phone: '11999999999',
    });

    const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: DEFAULT_PASSWORD });

    return res.body.accessToken as string;
}

export async function createUserAndGetToken(email: string): Promise<{ token: string; cleanup: () => Promise<void> }> {
    const token = await registerAndLogin(email);
    return {
        token,
        cleanup: () => cleanupUser(email),
    };
}
