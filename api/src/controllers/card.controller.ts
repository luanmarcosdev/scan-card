import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { CardService } from "../services/card.service";
import { CardRepositoryMySQL } from "../repositories/card.repository.mysql";
import { RedisCacheProvider } from "../infra/cache/redis-cache.provider";
import { CreateCardDto } from "../dtos/card/create-card.dto";
import { UpdateCardDto } from "../dtos/card/update-card.dto";
import { CardResponseDto } from "../dtos/card/response-card.dto";
import { IResponse } from "../dtos/success-response.dto";
import { BadRequestError } from "../errors/bad-request.error";
import { cardToResponseDto } from "../mappers/card.mapper";

const repository = new CardRepositoryMySQL();
const cacheProvider = new RedisCacheProvider();
const service = new CardService(repository, cacheProvider);

export class CardController {

    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const cards = await service.findAll(req.userId);
            const response: IResponse<CardResponseDto> = {
                status: 200,
                message: 'Cards retrieved successfully',
                data: cards.map(cardToResponseDto),
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const card = await service.findById(req.params.id, req.userId);
            const response: IResponse<CardResponseDto> = {
                status: 200,
                message: 'Card retrieved successfully',
                data: cardToResponseDto(card),
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new CreateCardDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            const card = await service.create(req.userId, dto);
            const response: IResponse<CardResponseDto> = {
                status: 201,
                message: 'Card created successfully',
                data: cardToResponseDto(card),
            };
            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new UpdateCardDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            const card = await service.update(req.params.id, req.userId, dto);
            const response: IResponse<CardResponseDto> = {
                status: 200,
                message: 'Card updated successfully',
                data: cardToResponseDto(card),
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
                message: 'Card deleted successfully',
                data: null,
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

}
