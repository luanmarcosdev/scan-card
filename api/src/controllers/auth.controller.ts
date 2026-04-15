import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { LoginDto } from "../dtos/auth/login.dto";
import { BadRequestError } from "../errors/bad-request.error";
import { AuthService } from "../services/auth.service";
import { UserRepositoryMySQL } from "../repositories/user.repository.mysql";
import { RedisCacheProvider } from "../infra/cache/redis-cache.provider";

const repository = new UserRepositoryMySQL();
const cacheProvider = new RedisCacheProvider();
const service = new AuthService(repository, cacheProvider);

export class AuthController {

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new LoginDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                errors.forEach(e => { e.target = undefined; });
                throw new BadRequestError({ message: "Validation failed", errors });
            }

            const result = await service.login(dto);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
