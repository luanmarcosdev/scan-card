import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { upload } from '../../src/middlewares/upload.middleware';

const app = express();

app.post('/test', upload.array('images'), (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json({ code: err.code ?? 'ERROR', message: err.message });
});

describe('upload middleware', () => {
    it('should accept a valid image under 3MB', async () => {
        const buffer = Buffer.alloc(1024);

        const res = await request(app)
            .post('/test')
            .attach('images', buffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(200);
    });

    it('should reject a file larger than 3MB with LIMIT_FILE_SIZE', async () => {
        const oversized = Buffer.alloc(3 * 1024 * 1024 + 1);

        const res = await request(app)
            .post('/test')
            .attach('images', oversized, { filename: 'big.jpg', contentType: 'image/jpeg' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('LIMIT_FILE_SIZE');
    });

    it('should reject invalid file extension', async () => {
        const buffer = Buffer.alloc(1024);

        const res = await request(app)
            .post('/test')
            .attach('images', buffer, { filename: 'document.pdf', contentType: 'application/pdf' });

        expect(res.status).toBe(400);
    });

    it('should accept exactly 8 files', async () => {
        const buffer = Buffer.alloc(1024);
        const req = request(app).post('/test');

        for (let i = 0; i < 8; i++) {
            req.attach('images', buffer, { filename: `img${i}.jpg`, contentType: 'image/jpeg' });
        }

        const res = await req;
        expect(res.status).toBe(200);
    });

    it('should reject more than 8 files with LIMIT_FILE_COUNT', async () => {
        const buffer = Buffer.alloc(1024);
        const req = request(app).post('/test');

        for (let i = 0; i < 9; i++) {
            req.attach('images', buffer, { filename: `img${i}.jpg`, contentType: 'image/jpeg' });
        }

        const res = await req;
        expect(res.status).toBe(400);
        expect(res.body.code).toBe('LIMIT_FILE_COUNT');
    });
});
