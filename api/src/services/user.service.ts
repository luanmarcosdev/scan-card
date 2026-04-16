import { User } from "../infra/database/entities/user.entity";
import { IUserRepository } from "../contracts/user-repository.interface";
import { NotFoundError } from "../errors/not-found.error";
import { BadRequestError } from "../errors/bad-request.error";
import { UserUpdateDto } from "../dtos/user/update-user.dto";
import { ICacheProvider } from "../contracts/cache-provider.interface";
import { AuthService } from "./auth.service";

export class UserService {

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly cacheProvider: ICacheProvider
    ) {}

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
            password: data.password ? await AuthService.hashPassword(data.password) : undefined,
            salary: data.salary,
        };

        const updatedUser = await this.userRepository.update(id, dataToUpdate);

        if (!updatedUser) {
            throw new NotFoundError({ message: "User not found to update" });
        }

        this.cacheProvider.del(`users:${id}`);

        return updatedUser;
    }

    async delete(id: string): Promise<void> {
        const user = await this.userRepository.findById(id);

        if (!user) {
            throw new NotFoundError({ message: "User not found" });
        }

        await this.userRepository.delete(id);
        await this.cacheProvider.del(`users:${id}`);
    }
}
