import { UserService } from "../../src/services/user.service";
import { IUserRepository } from "../../src/contracts/user-repository.interface";
import { NotFoundError } from "../../src/errors/not-found.error";
import { BadRequestError } from "../../src/errors/bad-request.error";
import { User } from "../../src/infra/database/entities/user.entity";
import { ICacheProvider } from "../../src/contracts/cache-provider.interface";

jest.mock('../../src/services/auth.service', () => ({
    AuthService: {
        hashPassword: jest.fn().mockResolvedValue('hashed_password'),
    },
}));

const mockUser: User = {
    id: 'uuid-abc-123',
    name: 'Luan Arruda',
    email: 'luan@test.com',
    document: '103.164.036-36',
    password: 'Luan123!',
    salary: 5000,
    phone: '32-99909-3190',
    created_at: new Date('2026-01-01'),
    updated_at: null,
    deleted_at: null,
};

describe("UserService", () => {
    let userService: UserService;
    let userRepository: jest.Mocked<IUserRepository>;
    let cacheProvider: jest.Mocked<ICacheProvider>;

    beforeEach(() => {
        jest.clearAllMocks();

        userRepository = {
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

        userService = new UserService(userRepository, cacheProvider);
    });

    describe("findById", () => {
        it("should return cached user on cache hit without calling DB", async () => {
            cacheProvider.get.mockResolvedValue(JSON.stringify(mockUser));

            const result = await userService.findById('uuid-abc-123');

            expect(result.id).toBe(mockUser.id);
            expect(result.email).toBe(mockUser.email);
            expect(userRepository.findById).not.toHaveBeenCalled();
        });

        it("should fetch from DB on cache miss and cache the result", async () => {
            cacheProvider.get.mockResolvedValue(null);
            userRepository.findById.mockResolvedValue(mockUser);

            const result = await userService.findById('uuid-abc-123');

            expect(result).toEqual(mockUser);
            expect(userRepository.findById).toHaveBeenCalledWith('uuid-abc-123');
            expect(cacheProvider.set).toHaveBeenCalledWith('users:uuid-abc-123', JSON.stringify(mockUser), 120);
        });

        it("should throw NotFoundError if user does not exist", async () => {
            cacheProvider.get.mockResolvedValue(null);
            userRepository.findById.mockResolvedValue(null);

            await expect(userService.findById('uuid-abc-123')).rejects.toBeInstanceOf(NotFoundError);
        });
    });

    describe("update", () => {
        it("should update name successfully", async () => {
            userRepository.findById.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({ ...mockUser, name: 'New Name' });

            const result = await userService.update('uuid-abc-123', { name: 'New Name' });

            expect(result.name).toBe('New Name');
            expect(userRepository.update).toHaveBeenCalledWith('uuid-abc-123', {
                name: 'New Name',
                password: undefined,
                salary: undefined,
            });
            expect(cacheProvider.del).toHaveBeenCalledWith('users:uuid-abc-123');
        });

        it("should update password successfully", async () => {
            userRepository.findById.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue(mockUser);

            await userService.update('uuid-abc-123', { password: 'NewPass1!' });

            expect(userRepository.update).toHaveBeenCalledWith('uuid-abc-123', {
                name: undefined,
                password: 'hashed_password',
                salary: undefined,
            });
        });

        it("should update salary successfully", async () => {
            userRepository.findById.mockResolvedValue(mockUser);
            userRepository.update.mockResolvedValue({ ...mockUser, salary: 8000 });

            const result = await userService.update('uuid-abc-123', { salary: 8000 });

            expect(result.salary).toBe(8000);
            expect(userRepository.update).toHaveBeenCalledWith('uuid-abc-123', {
                name: undefined,
                password: undefined,
                salary: 8000,
            });
        });

        it("should throw NotFoundError if user does not exist", async () => {
            userRepository.findById.mockResolvedValue(null);

            await expect(
                userService.update('uuid-abc-123', { name: 'New Name' })
            ).rejects.toBeInstanceOf(NotFoundError);
            expect(userRepository.update).not.toHaveBeenCalled();
        });

        it("should throw BadRequestError if no data provided", async () => {
            userRepository.findById.mockResolvedValue(mockUser);

            await expect(userService.update('uuid-abc-123', {})).rejects.toBeInstanceOf(BadRequestError);
            expect(userRepository.update).not.toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("should delete user and invalidate cache", async () => {
            userRepository.findById.mockResolvedValue(mockUser);
            userRepository.delete.mockResolvedValue(undefined);

            await userService.delete('uuid-abc-123');

            expect(userRepository.delete).toHaveBeenCalledWith('uuid-abc-123');
            expect(cacheProvider.del).toHaveBeenCalledWith('users:uuid-abc-123');
        });

        it("should throw NotFoundError if user does not exist", async () => {
            userRepository.findById.mockResolvedValue(null);

            await expect(userService.delete('uuid-abc-123')).rejects.toBeInstanceOf(NotFoundError);
            expect(userRepository.delete).not.toHaveBeenCalled();
        });
    });
});
