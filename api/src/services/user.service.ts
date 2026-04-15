import { User } from "../infra/database/entities/user.entity";
import { IUserRepository } from "../contracts/user-repository.interface";
import { UserCreateDto } from "../dtos/user/create-user.dto";
import { ConflictError } from "../errors/conflict.error";
import { NotFoundError } from "../errors/not-found.error";
import { BadRequestError } from "../errors/bad-request.error";
import { UserUpdateDto } from "../dtos/user/update-user.dto";
import { setTimeout } from 'timers/promises';
import { ICacheProvider } from "../contracts/cache-provider.interface";
import { formatPhone } from "../utils/phone.validator";

export class UserService {

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly cacheProvider: ICacheProvider
    ) {}

    async get(): Promise<User[]> {
        const cacheKey = 'users:all';
        const cachedUsers = await this.cacheProvider.get(cacheKey);

        if (cachedUsers) {
            return JSON.parse(cachedUsers);
        }

        await setTimeout(2000);

        const users = await this.userRepository.get();

        if (!users || users.length === 0) {
            throw new NotFoundError({ message: "No users found" });
        }

        await this.cacheProvider.set(cacheKey, JSON.stringify(users), 120);

        return users;
    }

    async create(data: UserCreateDto): Promise<User> {
        const existingUser = await this.userRepository.findByEmail(data.email);

        if (existingUser) {
            throw new ConflictError({ message: "Email already in use" });
        }

        data.phone = formatPhone(data.phone);
        const user = await this.userRepository.create(data);

        await this.cacheProvider.del('users:all');

        return user;
    }

    async findById(id: string): Promise<User> {
        const cachedKey = `users:${id}`;
        const cachedUser = await this.cacheProvider.get(cachedKey);

        if (cachedUser) {
            return JSON.parse(cachedUser);
        }

        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundError({ message: "User not found" });
        }

        await this.cacheProvider.set(cachedKey, JSON.stringify(user), 120);

        return user;
    }

    async update(id: string, data: UserUpdateDto): Promise<User> {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundError({ message: "User not found" });
        }

        if (data.name === undefined && data.password === undefined && data.salary === undefined) {
            throw new BadRequestError({
                message: "No data provided for update",
                errors: { required: "provide at least one of: name, password, salary" },
            });
        }

        const dataToUpdate: UserUpdateDto = {
            name: data.name,
            password: data.password,
            salary: data.salary,
        };

        const updatedUser = await this.userRepository.update(id, dataToUpdate);

        if (!updatedUser) {
            throw new NotFoundError({ message: "User not found to update" });
        }

        this.cacheProvider.del('users:all');
        this.cacheProvider.del(`users:${id}`);

        return updatedUser;
    }

    async delete(id: string): Promise<void> {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundError({ message: "User not found" });
        }

        await this.userRepository.delete(id);
        await this.cacheProvider.del('users:all');
        await this.cacheProvider.del(`users:${id}`);
    }
}
