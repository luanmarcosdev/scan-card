import { StatementProcessorService } from '../../src/services/statement-processor.service';
import { ICardStatementRepository } from '../../src/contracts/card-statement-repository.interface';
import { ICardStatementImageRepository } from '../../src/contracts/card-statement-image-repository.interface';
import { ICardTransactionRepository } from '../../src/contracts/card-transaction-repository.interface';
import { IExpenseCategoryRepository } from '../../src/contracts/expense-category-repository.interface';
import { IJobRepository } from '../../src/contracts/job-repository.interface';
import { IAuditLogRepository } from '../../src/contracts/audit-log-repository.interface';
import { IAiStatementExtractor } from '../../src/contracts/ai-statement-extractor.interface';
import { CardStatement } from '../../src/infra/database/entities/card-statement.entity';
import { CardStatementImage } from '../../src/infra/database/entities/card-statement-image.entity';
import { ExpenseCategory } from '../../src/infra/database/entities/expense-category.entity';

const mockStatement: CardStatement = {
    id: 'stmt-uuid-123',
    card_id: 'card-uuid-123',
    user_id: 'user-uuid-123',
    status_id: 2,
    year_reference: 2026,
    month_reference: 4,
    total: 100.00,
    created_at: new Date('2026-01-01'),
    updated_at: null,
    deleted_at: null,
};

const mockImages: CardStatementImage[] = [
    { id: 'img-1', card_statement_id: 'stmt-uuid-123', image_path: '/uploads/user/stmt/img1.jpg', created_at: new Date() },
];

const mockCategories: ExpenseCategory[] = [
    { id: 'cat-uuid-1', user_id: 'user-uuid-123', category: 'Food', description: null, created_at: new Date(), updated_at: null, deleted_at: null },
];

describe('StatementProcessorService', () => {
    let service: StatementProcessorService;
    let statementRepo: jest.Mocked<ICardStatementRepository>;
    let imageRepo: jest.Mocked<ICardStatementImageRepository>;
    let transactionRepo: jest.Mocked<ICardTransactionRepository>;
    let categoryRepo: jest.Mocked<IExpenseCategoryRepository>;
    let jobRepo: jest.Mocked<IJobRepository>;
    let auditRepo: jest.Mocked<IAuditLogRepository>;
    let aiExtractor: jest.Mocked<IAiStatementExtractor>;

    beforeEach(() => {
        jest.clearAllMocks();

        statementRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIdAndUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            delete: jest.fn(),
        };

        imageRepo = {
            findByStatementId: jest.fn(),
            createMany: jest.fn(),
        };

        transactionRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIdAndUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        categoryRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIdAndUserId: jest.fn(),
            create: jest.fn(),
            createMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            isInUse: jest.fn(),
        };

        jobRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            findByStatementId: jest.fn(),
            updateStatus: jest.fn(),
            updateStatusByStatementId: jest.fn(),
            incrementRetries: jest.fn(),
        };

        auditRepo = {
            create: jest.fn(),
            findByStatementId: jest.fn(),
        };

        aiExtractor = {
            analyseAndExtractTransactions: jest.fn(),
        };

        service = new StatementProcessorService(
            statementRepo,
            imageRepo,
            transactionRepo,
            categoryRepo,
            jobRepo,
            auditRepo,
            aiExtractor,
        );
    });

    describe('process', () => {
        it('should throw if statement is not found', async () => {
            statementRepo.findById.mockResolvedValue(null);

            await expect(service.process('stmt-uuid-123')).rejects.toThrow('Statement not found: stmt-uuid-123');
        });

        it('should throw if no images are found', async () => {
            statementRepo.findById.mockResolvedValue(mockStatement);
            statementRepo.updateStatus.mockResolvedValue();
            jobRepo.updateStatusByStatementId.mockResolvedValue();
            imageRepo.findByStatementId.mockResolvedValue([]);

            await expect(service.process('stmt-uuid-123')).rejects.toThrow('No images found for statement: stmt-uuid-123');
        });

        it('should set status 9 and create audit log when AI returns invalid image', async () => {
            statementRepo.findById.mockResolvedValue(mockStatement);
            statementRepo.updateStatus.mockResolvedValue();
            jobRepo.updateStatusByStatementId.mockResolvedValue();
            imageRepo.findByStatementId.mockResolvedValue(mockImages);
            categoryRepo.findAll.mockResolvedValue(mockCategories);
            aiExtractor.analyseAndExtractTransactions.mockResolvedValue({
                valid: false,
                transactions: [],
                inputTokens: 100,
                outputTokens: 20,
                rawResponse: { status: 400, message: 'not a statement' },
            });
            auditRepo.create.mockResolvedValue({} as any);

            await service.process('stmt-uuid-123');

            expect(statementRepo.updateStatus).toHaveBeenCalledWith('stmt-uuid-123', 9);
            expect(jobRepo.updateStatusByStatementId).toHaveBeenCalledWith('stmt-uuid-123', 9);
            expect(auditRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status_id: 9, transactions_extracted: 0 }));
            expect(transactionRepo.create).not.toHaveBeenCalled();
        });

        it('should save transactions and set status 4 when total is within tolerance', async () => {
            statementRepo.findById.mockResolvedValue({ ...mockStatement, total: 100.00 });
            statementRepo.updateStatus.mockResolvedValue();
            jobRepo.updateStatusByStatementId.mockResolvedValue();
            imageRepo.findByStatementId.mockResolvedValue(mockImages);
            categoryRepo.findAll.mockResolvedValue(mockCategories);
            aiExtractor.analyseAndExtractTransactions.mockResolvedValue({
                valid: true,
                transactions: [
                    { expense_category_id: 'cat-uuid-1', merchant: 'Mercado', transaction_date: '2026-04-10', parcels: 1, current_parcel: 1, parcel_value: 100.00, total: 100.00 },
                ],
                inputTokens: 200,
                outputTokens: 50,
                rawResponse: { status: 200, data: [] },
            });
            transactionRepo.create.mockResolvedValue({} as any);
            auditRepo.create.mockResolvedValue({} as any);

            await service.process('stmt-uuid-123');

            expect(transactionRepo.create).toHaveBeenCalledTimes(1);
            expect(statementRepo.updateStatus).toHaveBeenLastCalledWith('stmt-uuid-123', 4);
            expect(jobRepo.updateStatusByStatementId).toHaveBeenLastCalledWith('stmt-uuid-123', 4);
            expect(auditRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status_id: 4, transactions_extracted: 1 }));
        });

        it('should set status 7 when extracted total differs from statement total by more than tolerance', async () => {
            statementRepo.findById.mockResolvedValue({ ...mockStatement, total: 200.00 });
            statementRepo.updateStatus.mockResolvedValue();
            jobRepo.updateStatusByStatementId.mockResolvedValue();
            imageRepo.findByStatementId.mockResolvedValue(mockImages);
            categoryRepo.findAll.mockResolvedValue(mockCategories);
            aiExtractor.analyseAndExtractTransactions.mockResolvedValue({
                valid: true,
                transactions: [
                    { expense_category_id: 'cat-uuid-1', merchant: 'Loja', transaction_date: '2026-04-15', parcels: 1, current_parcel: 1, parcel_value: 100.00, total: 100.00 },
                ],
                inputTokens: 200,
                outputTokens: 50,
                rawResponse: { status: 200, data: [] },
            });
            transactionRepo.create.mockResolvedValue({} as any);
            auditRepo.create.mockResolvedValue({} as any);

            await service.process('stmt-uuid-123');

            expect(statementRepo.updateStatus).toHaveBeenLastCalledWith('stmt-uuid-123', 7);
            expect(jobRepo.updateStatusByStatementId).toHaveBeenLastCalledWith('stmt-uuid-123', 7);
            expect(auditRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status_id: 7 }));
        });

        it('should set status 4 when total diff is exactly at the tolerance boundary', async () => {
            statementRepo.findById.mockResolvedValue({ ...mockStatement, total: 110.00 });
            statementRepo.updateStatus.mockResolvedValue();
            jobRepo.updateStatusByStatementId.mockResolvedValue();
            imageRepo.findByStatementId.mockResolvedValue(mockImages);
            categoryRepo.findAll.mockResolvedValue(mockCategories);
            aiExtractor.analyseAndExtractTransactions.mockResolvedValue({
                valid: true,
                transactions: [
                    { expense_category_id: 'cat-uuid-1', merchant: 'Loja', transaction_date: '2026-04-15', parcels: 1, current_parcel: 1, parcel_value: 100.00, total: 100.00 },
                ],
                inputTokens: 150,
                outputTokens: 40,
                rawResponse: { status: 200, data: [] },
            });
            transactionRepo.create.mockResolvedValue({} as any);
            auditRepo.create.mockResolvedValue({} as any);

            await service.process('stmt-uuid-123');

            expect(statementRepo.updateStatus).toHaveBeenLastCalledWith('stmt-uuid-123', 4);
        });

        it('should pass correct params to aiExtractor', async () => {
            statementRepo.findById.mockResolvedValue(mockStatement);
            statementRepo.updateStatus.mockResolvedValue();
            jobRepo.updateStatusByStatementId.mockResolvedValue();
            imageRepo.findByStatementId.mockResolvedValue(mockImages);
            categoryRepo.findAll.mockResolvedValue(mockCategories);
            aiExtractor.analyseAndExtractTransactions.mockResolvedValue({
                valid: true,
                transactions: [],
                inputTokens: null,
                outputTokens: null,
                rawResponse: { status: 200, data: [] },
            });
            auditRepo.create.mockResolvedValue({} as any);

            await service.process('stmt-uuid-123');

            expect(aiExtractor.analyseAndExtractTransactions).toHaveBeenCalledWith({
                imagePaths: ['/uploads/user/stmt/img1.jpg'],
                categoryList: [{ id: 'cat-uuid-1', name: 'Food' }],
                monthReference: 4,
                yearReference: 2026,
            });
        });

        it('should set status 3 (processing) before calling AI', async () => {
            const callOrder: string[] = [];

            statementRepo.findById.mockResolvedValue(mockStatement);
            statementRepo.updateStatus.mockImplementation(async (_id, statusId) => {
                callOrder.push(`updateStatus:${statusId}`);
            });
            jobRepo.updateStatusByStatementId.mockImplementation(async (_id, statusId) => {
                callOrder.push(`updateJob:${statusId}`);
            });
            imageRepo.findByStatementId.mockResolvedValue(mockImages);
            categoryRepo.findAll.mockResolvedValue(mockCategories);
            aiExtractor.analyseAndExtractTransactions.mockImplementation(async () => {
                callOrder.push('ai');
                return { valid: true, transactions: [], inputTokens: null, outputTokens: null, rawResponse: { status: 200, data: [] } };
            });
            auditRepo.create.mockResolvedValue({} as any);

            await service.process('stmt-uuid-123');

            expect(callOrder.indexOf('updateStatus:3')).toBeLessThan(callOrder.indexOf('ai'));
        });

        it('should use total as parcel_value and omit merchant and transaction_date when they are null', async () => {
            statementRepo.findById.mockResolvedValue({ ...mockStatement, total: 50.00 });
            statementRepo.updateStatus.mockResolvedValue();
            jobRepo.updateStatusByStatementId.mockResolvedValue();
            imageRepo.findByStatementId.mockResolvedValue(mockImages);
            categoryRepo.findAll.mockResolvedValue(mockCategories);
            aiExtractor.analyseAndExtractTransactions.mockResolvedValue({
                valid: true,
                transactions: [
                    { expense_category_id: 'cat-uuid-1', merchant: null, transaction_date: null, parcels: 1, current_parcel: 1, parcel_value: null, total: 50.00 },
                ],
                inputTokens: null,
                outputTokens: null,
                rawResponse: { status: 200, data: [] },
            });
            transactionRepo.create.mockResolvedValue({} as any);
            auditRepo.create.mockResolvedValue({} as any);

            await service.process('stmt-uuid-123');

            expect(transactionRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    merchant: undefined,
                    transaction_date: undefined,
                    parcel_value: 50.00,
                }),
                'user-uuid-123',
                'stmt-uuid-123',
            );
        });
    });
});
