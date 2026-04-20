import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { CardTransactionService } from "../services/card-transaction.service";
import { CardTransactionRepositoryMySQL } from "../repositories/card-transaction.repository.mysql";
import { ExpenseCategoryRepositoryMySQL } from "../repositories/expense-category.repository.mysql";
import { RedisCacheProvider } from "../infra/cache/redis-cache.provider";
import { CreateCardTransactionDto } from "../dtos/card-transaction/create-card-transaction.dto";
import { UpdateCardTransactionDto } from "../dtos/card-transaction/update-card-transaction.dto";
import { CardTransactionResponseDto } from "../dtos/card-transaction/response-card-transaction.dto";
import { IResponse } from "../dtos/success-response.dto";
import { BadRequestError } from "../errors/bad-request.error";
import { cardTransactionToResponseDto } from "../mappers/card-transaction.mapper";

const service = new CardTransactionService(
    new CardTransactionRepositoryMySQL(),
    new RedisCacheProvider(),
    new ExpenseCategoryRepositoryMySQL(),
);

export class CardTransactionController {

    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const transactions = await service.findAll(req.userId, req.params.statementId);
            const response: IResponse<CardTransactionResponseDto> = {
                status: 200,
                message: 'Card transactions retrieved successfully',
                data: transactions.map(cardTransactionToResponseDto),
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const transaction = await service.findById(req.params.id, req.userId);
            const response: IResponse<CardTransactionResponseDto> = {
                status: 200,
                message: 'Card transaction retrieved successfully',
                data: cardTransactionToResponseDto(transaction),
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new CreateCardTransactionDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            const transaction = await service.create(req.userId, req.params.statementId, dto);
            const response: IResponse<CardTransactionResponseDto> = {
                status: 201,
                message: 'Card transaction created successfully',
                data: cardTransactionToResponseDto(transaction),
            };
            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new UpdateCardTransactionDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            const transaction = await service.update(req.params.id, req.userId, dto);
            const response: IResponse<CardTransactionResponseDto> = {
                status: 200,
                message: 'Card transaction updated successfully',
                data: cardTransactionToResponseDto(transaction),
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
                message: 'Card transaction deleted successfully',
                data: null,
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

}
