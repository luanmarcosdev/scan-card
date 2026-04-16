import { AppDataSource } from '../infra/database/data-source';
import { User } from '../infra/database/entities/user.entity';
import { IUserRepository } from '../contracts/user-repository.interface';
import { UserCreateDto } from "../dtos/user/create-user.dto";
import { NotFoundError } from '../errors/not-found.error';
import { UserUpdateDto } from '../dtos/user/update-user.dto';

export class UserRepositoryMySQL implements IUserRepository {

    private UserRepositoryORM = AppDataSource.getRepository(User);

    async findById(id: string): Promise<User | null> {
        return await this.UserRepositoryORM.findOneBy({ id });
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.UserRepositoryORM.findOneBy({ email });
    }

    async create(userData: UserCreateDto): Promise<User> {
        return await this.UserRepositoryORM.save(userData);
    }

    async update(id: string, updateData: UserUpdateDto): Promise<User | null> {
        const result = await this.UserRepositoryORM.update({ id }, updateData);

        if (result.affected === 0) {
            throw new NotFoundError({ message: 'User not found' });
        }

        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        const deleteOperation = await this.UserRepositoryORM.delete(id);

        if (deleteOperation.affected === 0) {
            throw new NotFoundError({ message: 'User not found' });
        }
    }

}
