import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { CardStatementService } from "../services/card-statement.service";
import { CardStatementRepositoryMySQL } from "../repositories/card-statement.repository.mysql";
import { CardStatementImageRepositoryMySQL } from "../repositories/card-statement-image.repository.mysql";
import { RedisCacheProvider } from "../infra/cache/redis-cache.provider";
import { LocalStorageProvider } from "../infra/storage/local-storage.provider";
import { CreateCardStatementDto } from "../dtos/card-statement/create-card-statement.dto";
import { UpdateCardStatementDto } from "../dtos/card-statement/update-card-statement.dto";
import { CardStatementResponseDto } from "../dtos/card-statement/response-card-statement.dto";
import { IResponse } from "../dtos/success-response.dto";
import { BadRequestError } from "../errors/bad-request.error";
import { cardStatementToResponseDto } from "../mappers/card-statement.mapper";

const cacheProvider = new RedisCacheProvider();
const service = new CardStatementService(
    new CardStatementRepositoryMySQL(),
    new CardStatementImageRepositoryMySQL(),
    cacheProvider,
    new LocalStorageProvider(),
);

export class CardStatementController {

    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const statements = await service.findAll(req.userId);
            const response: IResponse<CardStatementResponseDto> = {
                status: 200,
                message: 'Card statements retrieved successfully',
                data: statements.map(cardStatementToResponseDto),
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const statement = await service.findById(req.params.id, req.userId);
            const response: IResponse<CardStatementResponseDto> = {
                status: 200,
                message: 'Card statement retrieved successfully',
                data: cardStatementToResponseDto(statement),
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = plainToClass(CreateCardStatementDto, req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            const files = (req.files as Express.Multer.File[] || []).map((f) => ({
                filename: f.originalname,
                buffer: f.buffer,
            }));

            const statement = await service.create(req.userId, dto, files);
            const response: IResponse<CardStatementResponseDto> = {
                status: 202,
                message: 'Card statement created and queued for processing',
                data: cardStatementToResponseDto(statement),
            };
            res.status(202).json(response);
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = Object.assign(new UpdateCardStatementDto(), req.body);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            const statement = await service.update(req.params.id, req.userId, dto);
            const response: IResponse<CardStatementResponseDto> = {
                status: 200,
                message: 'Card statement updated successfully',
                data: cardStatementToResponseDto(statement),
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
                message: 'Card statement deleted successfully',
                data: null,
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

}
