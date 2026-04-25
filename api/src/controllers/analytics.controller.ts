import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsRepositoryMySQL } from '../repositories/analytics.repository.mysql';
import { UserRepositoryMySQL } from '../repositories/user.repository.mysql';
import { QueryAnalyticsDto } from '../dtos/analytics/query-analytics.dto';
import { AnalyticsResponseDto } from '../dtos/analytics/response-analytics.dto';
import { IResponse } from '../dtos/success-response.dto';
import { BadRequestError } from '../errors/bad-request.error';

const service = new AnalyticsService(
    new AnalyticsRepositoryMySQL(),
    new UserRepositoryMySQL(),
);

export class AnalyticsController {

    async getAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const dto = plainToClass(QueryAnalyticsDto, req.query);
            const errors = await validate(dto);

            if (errors.length) {
                throw new BadRequestError({ message: 'Validation failed', errors });
            }

            if (dto.month !== undefined && dto.year === undefined) {
                throw new BadRequestError({ message: 'year is required when month is provided' });
            }

            const result = await service.getAnalytics(req.userId, dto);
            const response: IResponse<AnalyticsResponseDto> = {
                status: 200,
                message: 'Analytics retrieved successfully',
                data: result,
            };
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

}
