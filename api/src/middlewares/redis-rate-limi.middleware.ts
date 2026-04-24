import { Request, Response, NextFunction } from 'express';
import { IRateLimitProvider } from '../contracts/rate-limit-provider.interface';

export function rateLimit(
  provider: IRateLimitProvider,
  maxRequests: number,
  ttl: number,
  keyFn: (req: Request) => string = (req) => req.ip!,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate_limit:${keyFn(req)}`;

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