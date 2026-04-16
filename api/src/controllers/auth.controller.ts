import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { LoginDto } from "../dtos/auth/login.dto";
import { RegisterDto } from "../dtos/auth/register.dto";
import { BadRequestError } from "../errors/bad-request.error";
import { AuthService } from "../services/auth.service";
import { ExpenseCategoryService } from "../services/expense-category.service";
import { UserRepositoryMySQL } from "../repositories/user.repository.mysql";
import { ExpenseCategoryRepositoryMySQL } from "../repositories/expense-category.repository.mysql";
import { RedisCacheProvider } from "../infra/cache/redis-cache.provider";
import { userToUserResponseDto } from "../mappers/user.mapper";
import { IResponse } from "../dtos/success-response.dto";
import { UserResponseDto } from "../dtos/user/response-user.dto";

const cacheProvider = new RedisCacheProvider();
const authService = new AuthService(new UserRepositoryMySQL(), cacheProvider);
const expenseCategoryService = new ExpenseCategoryService(new ExpenseCategoryRepositoryMySQL(), cacheProvider);

export class AuthController {

    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new RegisterDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: "Validation failed", errors });
            }

            const user = await authService.register(dto);
            await expenseCategoryService.createDefaults(user.id);

            const response: IResponse<UserResponseDto> = {
                status: 201,
                message: "User created successfully",
                data: userToUserResponseDto(user),
            };

            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new LoginDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                errors.forEach(e => { e.target = undefined; });
                throw new BadRequestError({ message: "Validation failed", errors });
            }

            const result = await authService.login(dto);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
