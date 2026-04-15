import { UserRepositoryMySQL } from '../repositories/user.repository.mysql';
import { UserService } from '../services/user.service';
import { Request, Response, NextFunction } from 'express';
import { UserCreateDto } from "../dtos/user/create-user.dto";
import { validate } from "class-validator";
import { IResponse } from '../dtos/success-response.dto';
import { UserResponseDto } from '../dtos/user/response-user.dto';
import { BadRequestError } from '../errors/bad-request.error';
import { UserUpdateDto } from '../dtos/user/update-user.dto';
import { userToUserResponseDto } from '../mappers/user.mapper';
import { RedisCacheProvider } from '../infra/cache/redis-cache.provider';

const repository = new UserRepositoryMySQL();
const cacheProvider = new RedisCacheProvider();
const service = new UserService(repository, cacheProvider);

export class UserController {

    async getAllUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await service.get();

            const usersDto: UserResponseDto[] = users.map((user) => userToUserResponseDto(user));

            const response: IResponse<UserResponseDto> = {
                status: 200,
                message: 'Users retrieved successfully',
                data: usersDto
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async createUser(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new UserCreateDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            const result = await service.create(dto);
            const response: IResponse<UserResponseDto> = {
                status: 201,
                message: 'User created successfully',
                data: userToUserResponseDto(result)
            };

            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    async findUser(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await service.findById(req.params.id);
            const response: IResponse<UserResponseDto> = {
                status: 200,
                message: 'User retrieved successfully',
                data: userToUserResponseDto(user)
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new UserUpdateDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            const result = await service.update(req.params.id, dto);
            const response: IResponse<UserResponseDto> = {
                status: 200,
                message: 'User updated successfully',
                data: userToUserResponseDto(result)
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            await service.delete(req.params.id);

            const response: IResponse<null> = {
                status: 200,
                message: 'User deleted successfully',
                data: null
            };

            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }
}
