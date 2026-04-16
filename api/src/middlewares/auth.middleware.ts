import jsonwebtoken from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/unauthorized.error';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(new UnauthorizedError({ message: 'Token não fornecido' }));
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return next(new UnauthorizedError({ message: 'Token mal formatado' }));
    }

    const token = parts[1];

    try {
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET as string) as { id: string; email: string };
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        next();
    } catch {
        next(new UnauthorizedError({ message: 'Token inválido ou expirado' }));
    }
}
