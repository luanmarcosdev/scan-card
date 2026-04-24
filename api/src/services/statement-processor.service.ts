import { ICardStatementRepository } from '../contracts/card-statement-repository.interface';
import { ICardStatementImageRepository } from '../contracts/card-statement-image-repository.interface';
import { ICardTransactionRepository } from '../contracts/card-transaction-repository.interface';
import { IExpenseCategoryRepository } from '../contracts/expense-category-repository.interface';
import { IJobRepository } from '../contracts/job-repository.interface';
import { IAuditLogRepository } from '../contracts/audit-log-repository.interface';
import { IAiStatementExtractor } from '../contracts/ai-statement-extractor.interface';

// Define a tolerance value for comparing the extracted total with the statement total
const TOTAL_TOLERANCE = 10;

export class StatementProcessorService {

    constructor(
        private readonly statementRepo: ICardStatementRepository,
        private readonly imageRepo: ICardStatementImageRepository,
        private readonly transactionRepo: ICardTransactionRepository,
        private readonly categoryRepo: IExpenseCategoryRepository,
        private readonly jobRepo: IJobRepository,
        private readonly auditRepo: IAuditLogRepository,
        private readonly aiExtractor: IAiStatementExtractor,
    ) {}

    async process(statementId: string): Promise<void> {
        const statement = await this.statementRepo.findById(statementId);
        if (!statement) throw new Error(`Statement not found: ${statementId}`);

        await this.updateStatementAndJob(statementId, 3);

        const images = await this.imageRepo.findByStatementId(statementId);
        if (!images.length) throw new Error(`No images found for statement: ${statementId}`);

        const categories = await this.categoryRepo.findAll(statement.user_id);
        const categoryList = categories.map((c) => ({ id: c.id, name: c.category }));

        const result = await this.aiExtractor.analyseAndExtractTransactions({
            imagePaths: images.map((img) => img.image_path),
            categoryList,
            monthReference: statement.month_reference,
            yearReference: statement.year_reference,
        });

        if (!result.valid) {
            await this.updateStatementAndJob(statementId, 9);
            await this.auditRepo.create({
                statement_id: statementId,
                input_tokens: result.inputTokens,
                output_tokens: result.outputTokens,
                raw_response: result.rawResponse,
                transactions_extracted: 0,
                status_id: 9,
                ip_address: statement.ip_address ?? null,
            });
            console.log(`[INFO]: Statement ${statementId} — invalid image, status set to 9`);
            return;
        }

        for (const tx of result.transactions) {
            await this.transactionRepo.create(
                {
                    expense_category_id: tx.expense_category_id,
                    merchant: tx.merchant ?? undefined,
                    transaction_date: tx.transaction_date ?? undefined,
                    parcels: tx.parcels ?? 1,
                    current_parcel: tx.current_parcel ?? 1,
                    parcel_value: tx.parcel_value ?? tx.total,
                    total_value: tx.total,
                },
                statement.user_id,
                statementId,
            );
        }

        const extractedTotal = result.transactions.reduce((sum, tx) => sum + (tx.parcel_value ?? tx.total ?? 0), 0);
        const diff = Math.abs(extractedTotal - (statement.total ?? 0));
        const finalStatus = diff <= TOTAL_TOLERANCE ? 4 : 7;

        await this.updateStatementAndJob(statementId, finalStatus);

        await this.auditRepo.create({
            statement_id: statementId,
            input_tokens: result.inputTokens,
            output_tokens: result.outputTokens,
            raw_response: result.rawResponse,
            transactions_extracted: result.transactions.length,
            status_id: finalStatus,
            ip_address: statement.ip_address ?? undefined,
        });

        console.log(`[INFO]: Statement ${statementId} processed — status: ${finalStatus}, transactions: ${result.transactions.length}`);
    }

    private async updateStatementAndJob(statementId: string, statusId: number): Promise<void> {
        await this.statementRepo.updateStatus(statementId, statusId);
        await this.jobRepo.updateStatusByStatementId(statementId, statusId);
    }
}
