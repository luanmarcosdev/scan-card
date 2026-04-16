import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { ExpenseCategoryService } from "../services/expense-category.service";
import { ExpenseCategoryRepositoryMySQL } from "../repositories/expense-category.repository.mysql";
import { RedisCacheProvider } from "../infra/cache/redis-cache.provider";
import { CreateExpenseCategoryDto } from "../dtos/expense-category/create-expense-category.dto";
import { UpdateExpenseCategoryDto } from "../dtos/expense-category/update-expense-category.dto";
import { ExpenseCategoryResponseDto } from "../dtos/expense-category/response-expense-category.dto";
import { IResponse } from "../dtos/success-response.dto";
import { BadRequestError } from "../errors/bad-request.error";
import { expenseCategoryToResponseDto } from "../mappers/expense-category.mapper";

const repository = new ExpenseCategoryRepositoryMySQL();
const cacheProvider = new RedisCacheProvider();
const service = new ExpenseCategoryService(repository, cacheProvider);

export class ExpenseCategoryController {

    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await service.findAll(req.userId);
            const response: IResponse<ExpenseCategoryResponseDto> = {
                status: 200,
                message: 'Expense categories retrieved successfully',
                data: categories.map(expenseCategoryToResponseDto),
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const category = await service.findById(req.params.id, req.userId);
            const response: IResponse<ExpenseCategoryResponseDto> = {
                status: 200,
                message: 'Expense category retrieved successfully',
                data: expenseCategoryToResponseDto(category),
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new CreateExpenseCategoryDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            const category = await service.create(req.userId, dto);
            const response: IResponse<ExpenseCategoryResponseDto> = {
                status: 201,
                message: 'Expense category created successfully',
                data: expenseCategoryToResponseDto(category),
            };
            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new UpdateExpenseCategoryDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            const category = await service.update(req.params.id, req.userId, dto);
            const response: IResponse<ExpenseCategoryResponseDto> = {
                status: 200,
                message: 'Expense category updated successfully',
                data: expenseCategoryToResponseDto(category),
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await service.delete(req.params.id, req.userId);
            const response: IResponse<null> = {
                status: 200,
                message: 'Expense category deleted successfully',
                data: null,
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

}
