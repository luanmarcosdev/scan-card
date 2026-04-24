import { Request, Response, NextFunction } from 'express';
import { IRateLimitProvider } from '../contracts/rate-limit-provider.interface';
import { formatSeconds } from '../utils/format-seconds.util';

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
      const retryAfter = await provider.ttl(key);
      return res.status(429).json({
        status: 429,
        message: 'Too many requests',
        errors_detail: {
          limit: maxRequests,
          window: formatSeconds(ttl),
          retry_after_seconds: retryAfter,
        },
      });
    }

    next();
  };
}