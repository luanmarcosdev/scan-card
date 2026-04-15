import { Request, Response, NextFunction } from 'express';
import { IRateLimitProvider } from '../contracts/rate-limit-provider.interface';

export function rateLimit(
  provider: IRateLimitProvider,
  maxRequests: number,
  ttl: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    const key = `rate_limit:${ip}`;

    const requests = await provider.incr(key);

    if (requests === 1) {
      await provider.expire(key, ttl);
    }

    if (requests > maxRequests) {
      return res.status(429).json({
        status: 429,
        message: 'Too many requests',
        method: req.method,
        path: req.path
      });
    }

    next();
  };
}