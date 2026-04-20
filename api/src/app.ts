import express from 'express';
import userRouter from './routes/user.routes';
import authRouter from './routes/auth.routes';
import cardRouter from './routes/card.routes';
import expenseCategoryRouter from './routes/expense-category.routes';
import cardStatementRouter from './routes/card-statement.routes';
import cardTransactionRouter from './routes/card-transaction.routes';
import { errorHandler } from './middlewares/error-handler.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { rateLimit } from './middlewares/redis-rate-limi.middleware';
import { RedisRateLimitProvider } from './infra/cache/redis-rate-limit.provider';

export const app = express();

app.use(express.json());
// app.use(rateLimit(new RedisRateLimitProvider(), 5, 120));
app.use('/api/', userRouter);
app.use('/api/', authRouter);
app.use('/api/', cardRouter);
app.use('/api/', expenseCategoryRouter);
app.use('/api/', cardStatementRouter);
app.use('/api/', cardTransactionRouter);
app.use(notFoundMiddleware);
app.use(errorHandler);