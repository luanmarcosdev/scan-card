import { AuthService } from "../../src/services/auth.service";
import { IUserRepository } from "../../src/contracts/user-repository.interface";
import { ICacheProvider } from "../../src/contracts/cache-provider.interface";
import { UnauthorizedError } from "../../src/errors/unauthorized.error";
import { User } from "../../src/infra/database/entities/user.entity";

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '2h';

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
}));

import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';

const mockUser: User = {
    id: 'uuid-abc-123',
    name: 'Luan Arruda',
    email: 'luan@test.com',
    document: '103.164.036-36',
    password: '$2b$10$hashedpassword',
    salary: 5000,
    phone: '32-99909-3190',
    created_at: new Date('2026-01-01'),
    updated_at: null,
    deleted_at: null,
};

const mockTokenResponse = {
    tokenType: 'Bearer',
    expiresIn: '2h',
    accessToken: 'mock.jwt.token',
};

describe("AuthService", () => {
    let authService: AuthService;
    let userRepository: jest.Mocked<IUserRepository>;
    let cacheProvider: jest.Mocked<ICacheProvider>;

    beforeEach(() => {
        jest.clearAllMocks();

        userRepository = {
            get: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        cacheProvider = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };

        authService = new AuthService(userRepository, cacheProvider);
    });

    describe("login", () => {
        it("should return cached token on cache hit", async () => {
            userRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            cacheProvider.get.mockResolvedValue(JSON.stringify(mockTokenResponse));

            const result = await authService.login({ email: 'luan@test.com', password: 'Luan123!' });

            expect(result).toEqual(mockTokenResponse);
            expect(jsonwebtoken.sign).not.toHaveBeenCalled();
            expect(cacheProvider.set).not.toHaveBeenCalled();
        });

        it("should generate and cache token on cache miss", async () => {
            userRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            cacheProvider.get.mockResolvedValue(null);

            const result = await authService.login({ email: 'luan@test.com', password: 'Luan123!' });

            expect(result).toEqual(mockTokenResponse);
            expect(jsonwebtoken.sign).toHaveBeenCalledWith(
                { id: mockUser.id, email: mockUser.email },
                'test-secret',
                { expiresIn: '2h' }
            );
            expect(cacheProvider.set).toHaveBeenCalledWith(
                `auth:session:${mockUser.id}`,
                JSON.stringify(mockTokenResponse),
                7200
            );
        });

        it("should generate token without caching if Redis get fails", async () => {
            userRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            cacheProvider.get.mockRejectedValue(new Error('Redis unavailable'));

            const result = await authService.login({ email: 'luan@test.com', password: 'Luan123!' });

            expect(result.accessToken).toBe('mock.jwt.token');
            expect(cacheProvider.set).toHaveBeenCalled();
        });

        it("should return token even if Redis set fails", async () => {
            userRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            cacheProvider.get.mockResolvedValue(null);
            cacheProvider.set.mockRejectedValue(new Error('Redis unavailable'));

            const result = await authService.login({ email: 'luan@test.com', password: 'Luan123!' });

            expect(result.accessToken).toBe('mock.jwt.token');
        });

        it("should throw UnauthorizedError if user not found", async () => {
            userRepository.findByEmail.mockResolvedValue(null);

            await expect(
                authService.login({ email: 'unknown@test.com', password: 'Any123!' })
            ).rejects.toBeInstanceOf(UnauthorizedError);

            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it("should throw UnauthorizedError if password does not match", async () => {
            userRepository.findByEmail.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                authService.login({ email: 'luan@test.com', password: 'WrongPass1!' })
            ).rejects.toBeInstanceOf(UnauthorizedError);
        });
    });

    describe("hashPassword", () => {
        it("should return hashed password", async () => {
            const result = await AuthService.hashPassword('Luan123!');

            expect(bcrypt.hash).toHaveBeenCalledWith('Luan123!', 10);
            expect(result).toBe('hashed_password');
        });
    });

    describe("comparePassword", () => {
        it("should return true if passwords match", async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await AuthService.comparePassword('Luan123!', '$2b$10$hashedpassword');

            expect(result).toBe(true);
        });

        it("should return false if passwords do not match", async () => {
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await AuthService.comparePassword('WrongPass!', '$2b$10$hashedpassword');

            expect(result).toBe(false);
        });
    });
});
