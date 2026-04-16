import { User } from '../infra/database/entities/user.entity'
import { RegisterDto } from "../dtos/auth/register.dto";
import { UserUpdateDto } from '../dtos/user/update-user.dto';

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(userData: RegisterDto): Promise<User>;
    update(id: string, updateData: UserUpdateDto): Promise<User | null>
    delete(id: string): Promise<void>;
}