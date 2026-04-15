import express from 'express';
import userRouter from './routes/user.routes';
import authRouter from './routes/auth.routes';
import { errorHandler } from './middlewares/error-handler.middleware';
import { rateLimit } from './middlewares/redis-rate-limi.middleware';
import { RedisRateLimitProvider } from './infra/cache/redis-rate-limit.provider';

export const app = express();

app.use(express.json());
// app.use(rateLimit(new RedisRateLimitProvider(), 5, 120));
app.use('/api/', userRouter);
app.use('/api/', authRouter);
app.use(errorHandler);