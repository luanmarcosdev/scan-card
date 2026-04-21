import { CardStatement } from "../infra/database/entities/card-statement.entity";
import { ICardStatementRepository } from "../contracts/card-statement-repository.interface";
import { ICardStatementImageRepository } from "../contracts/card-statement-image-repository.interface";
import { ICardRepository } from "../contracts/card-repository.interface";
import { ICacheProvider } from "../contracts/cache-provider.interface";
import { IStorageProvider } from "../contracts/storage-provider.interface";
import { CreateCardStatementDto } from "../dtos/card-statement/create-card-statement.dto";
import { UpdateCardStatementDto } from "../dtos/card-statement/update-card-statement.dto";
import { NotFoundError } from "../errors/not-found.error";
import { ConflictError } from "../errors/conflict.error";
import { BadRequestError } from "../errors/bad-request.error";

export interface ImageFile {
    filename: string;
    buffer: Buffer;
}

// 1 = pending, 4 = success, 6 = dlq: nao ha processamento ativo nem dados sendo gerados
const DELETABLE_STATUSES = [1, 4, 6];

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

export class CardStatementService {

    constructor(
        private readonly statementRepository: ICardStatementRepository,
        private readonly imageRepository: ICardStatementImageRepository,
        private readonly cacheProvider: ICacheProvider,
        private readonly storageProvider: IStorageProvider,
        private readonly cardRepository: ICardRepository,
    ) {}

    async findAll(userId: string, cardId: string): Promise<CardStatement[]> {
        const cacheKey = `card_statements:${cardId}:all`;
        const cached = await this.cacheProvider.get(cacheKey);

        if (cached) return JSON.parse(cached);

        const statements = await this.statementRepository.findAll(userId, cardId);

        await this.cacheProvider.set(cacheKey, JSON.stringify(statements), 120);

        return statements;
    }

    async findById(id: string, userId: string): Promise<CardStatement> {
        const cacheKey = `card_statements:${id}`;
        const cached = await this.cacheProvider.get(cacheKey);

        if (cached) return JSON.parse(cached);

        const statement = await this.statementRepository.findByIdAndUserId(id, userId);

        if (!statement) {
            throw new NotFoundError({ message: 'Card statement not found' });
        }

        await this.cacheProvider.set(cacheKey, JSON.stringify(statement), 120);

        return statement;
    }

    async create(userId: string, cardId: string, data: CreateCardStatementDto, files: ImageFile[]): Promise<CardStatement> {
        const card = await this.cardRepository.findByIdAndUserId(cardId, userId);

        if (!card) {
            throw new NotFoundError({ message: 'Card not found' });
        }

        if (!files || files.length === 0) {
            throw new BadRequestError({ message: 'At least one image is required' });
        }

        const invalidFiles = files.filter((f) => {
            const ext = f.filename.split('.').pop()?.toLowerCase();
            return !ext || !ALLOWED_EXTENSIONS.includes(ext);
        });

        if (invalidFiles.length > 0) {
            throw new BadRequestError({
                message: 'Invalid file type',
                errors: { allowed: `only ${ALLOWED_EXTENSIONS.join(', ')} are accepted` },
            });
        }

        const statement = await this.statementRepository.create(data, userId, cardId);

        const imagePaths: Array<{ card_statement_id: string; image_path: string }> = [];

        for (const file of files) {
            const path = await this.storageProvider.save(file, `${userId}/${statement.id}`);
            imagePaths.push({ card_statement_id: statement.id, image_path: path });
        }

        await this.imageRepository.createMany(imagePaths);

        // 2 = sent: imagens salvas e prontas para o worker consumir
        await this.statementRepository.updateStatus(statement.id, 2);

        // TODO: publicar na exchange quando o worker for implementado
        // publishToExchange('statements', 'process', JSON.stringify({ statementId: statement.id }));

        await this.cacheProvider.del(`card_statements:${cardId}:all`);

        return { ...statement, status_id: 2 };
    }

    async update(id: string, userId: string, data: UpdateCardStatementDto): Promise<CardStatement> {
        const statement = await this.statementRepository.findByIdAndUserId(id, userId);

        if (!statement) {
            throw new NotFoundError({ message: 'Card statement not found' });
        }

        if (data.total === undefined) {
            throw new BadRequestError({
                message: 'No data provided for update',
                errors: { required: 'provide at least: total' },
            });
        }

        const updated = await this.statementRepository.update(id, data);

        if (!updated) {
            throw new NotFoundError({ message: 'Card statement not found' });
        }

        this.cacheProvider.del(`card_statements:${id}`);
        this.cacheProvider.del(`card_statements:${statement.card_id}:all`);

        return updated;
    }

    async delete(id: string, userId: string): Promise<void> {
        const statement = await this.statementRepository.findByIdAndUserId(id, userId);

        if (!statement) {
            throw new NotFoundError({ message: 'Card statement not found' });
        }

        if (!DELETABLE_STATUSES.includes(statement.status_id)) {
            throw new ConflictError({ message: 'Card statement cannot be deleted while being processed' });
        }

        await this.statementRepository.delete(id);

        await this.cacheProvider.del(`card_statements:${id}`);
        await this.cacheProvider.del(`card_statements:${statement.card_id}:all`);
    }

}
