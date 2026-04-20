import { Request, Response, NextFunction } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { authMiddleware } from '../../src/middlewares/auth.middleware';
import { UnauthorizedError } from '../../src/errors/unauthorized.error';

const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

function makeReq(authorization?: string): Request {
    return { headers: { authorization } } as unknown as Request;
}

const res = {} as Response;

beforeEach(() => jest.clearAllMocks());

describe('authMiddleware', () => {
    it('should call next with UnauthorizedError when no authorization header', () => {
        authMiddleware(makeReq(), res, mockNext);

        const error = mockNext.mock.calls[0][0] as unknown as UnauthorizedError;
        expect(error).toBeInstanceOf(UnauthorizedError);
        expect(error.status).toBe(401);
    });

    it('should call next with UnauthorizedError when token is malformed (missing Bearer)', () => {
        authMiddleware(makeReq('InvalidToken'), res, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should call next with UnauthorizedError when scheme is not Bearer', () => {
        authMiddleware(makeReq('Basic sometoken'), res, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should call next with UnauthorizedError when token is invalid', () => {
        authMiddleware(makeReq('Bearer invalidtoken'), res, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should set userId and userEmail and call next on valid token', () => {
        process.env.JWT_SECRET = 'testsecret';
        const token = jsonwebtoken.sign({ id: 'user-uuid', email: 'user@test.com' }, 'testsecret');
        const req = makeReq(`Bearer ${token}`);

        authMiddleware(req, res, mockNext);

        expect(req.userId).toBe('user-uuid');
        expect(req.userEmail).toBe('user@test.com');
        expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with UnauthorizedError when token is expired', () => {
        process.env.JWT_SECRET = 'testsecret';
        const token = jsonwebtoken.sign({ id: 'user-uuid', email: 'user@test.com' }, 'testsecret', { expiresIn: -1 });

        authMiddleware(makeReq(`Bearer ${token}`), res, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
});
