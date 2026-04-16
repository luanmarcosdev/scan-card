import { User } from '../infra/database/entities/user.entity'
import { UserCreateDto } from "../dtos/user/create-user.dto.js";
import { UserUpdateDto } from '../dtos/user/update-user.dto';

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(userData: UserCreateDto): Promise<User>;
    update(id: string, updateData: UserUpdateDto): Promise<User | null>
    delete(id: string): Promise<void>;
}