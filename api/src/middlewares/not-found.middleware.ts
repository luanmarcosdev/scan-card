import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/not-found.error';

export function notFoundMiddleware(req: Request, res: Response, next: NextFunction) {
    next(new NotFoundError({ message: `Route ${req.method} ${req.originalUrl} not found` }));
}
