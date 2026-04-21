import 'dotenv/config';
import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import { connectRabbitMQ } from '../infra/message-broker/rabbitmq';
import { consumeFromExchange } from '../infra/message-broker/consumer';
import { AppDataSource } from '../infra/database/data-source';
import { CardStatementRepositoryMySQL } from '../repositories/card-statement.repository.mysql';
import { CardStatementImageRepositoryMySQL } from '../repositories/card-statement-image.repository.mysql';
import { CardTransactionRepositoryMySQL } from '../repositories/card-transaction.repository.mysql';
import { ExpenseCategoryRepositoryMySQL } from '../repositories/expense-category.repository.mysql';
import { JobRepositoryMySQL } from '../repositories/job.repository.mysql';
import { AuditLogRepositoryMySQL } from '../repositories/audit-log.repository.mysql';

const EXCHANGE = 'events';
const ROUTING_KEY = 'statement-ai-process';
const QUEUE = 'events.statement-ai-process';

const MAX_RETRIES = Number(process.env.RABBITMQ_STATEMENT_AI_MAX_RETRIES ?? 3);
const RETRY_DELAY = Number(process.env.RABBITMQ_STATEMENT_AI_RETRY_DELAY ?? 5000);
const TOTAL_TOLERANCE = 10;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const statementRepo = new CardStatementRepositoryMySQL();
const imageRepo = new CardStatementImageRepositoryMySQL();
const transactionRepo = new CardTransactionRepositoryMySQL();
const categoryRepo = new ExpenseCategoryRepositoryMySQL();
const jobRepo = new JobRepositoryMySQL();
const auditRepo = new AuditLogRepositoryMySQL();

async function updateStatementAndJob(statementId: string, statusId: number): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
        await manager.query(`UPDATE card_statements SET status_id = ? WHERE id = ?`, [statusId, statementId]);
        await manager.query(`UPDATE jobs SET status_id = ? WHERE statement_id = ?`, [statusId, statementId]);
    });
}

async function processMessage(raw: string): Promise<void> {
    const { statementId } = JSON.parse(raw) as { statementId: string };

    const statement = await statementRepo.findById(statementId);
    if (!statement) throw new Error(`Statement not found: ${statementId}`);

    await updateStatementAndJob(statementId, 3);

    const images = await imageRepo.findByStatementId(statementId);
    if (!images.length) throw new Error(`No images found for statement: ${statementId}`);

    const categories = await categoryRepo.findAll(statement.user_id);
    const categoryList = categories.map((c) => ({ id: c.id, name: c.category }));

    const imageContents: OpenAI.Chat.ChatCompletionContentPartImage[] = await Promise.all(
        images.map(async (img) => {
            const buffer = await readFile(img.image_path);
            const base64 = buffer.toString('base64');
            const ext = img.image_path.split('.').pop()?.toLowerCase() ?? 'jpeg';
            const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
            return {
                type: 'image_url' as const,
                image_url: { url: `data:${mime};base64,${base64}` },
            };
        })
    );

    const systemPrompt = `You are a financial data extraction assistant. Analyze credit card statement images and extract transaction data.

Rules:
1. First verify the image is strictly a credit card statement or invoice. If not, respond: {"status": 400, "message": "The submitted images do not appear to be credit card statements"}
2. If valid, extract all transactions: {"status": 200, "data": [...]}
3. Classify each transaction using the provided expense categories based on the merchant name.
4. Each transaction must include: expense_category_id, merchant, transaction_date (YYYY-MM-DD or null), parcels (integer, default 1), parcel_value (decimal or null), total (decimal).
5. total = full purchase value (all parcels combined). parcel_value = value of each individual parcel.
6. If a field cannot be determined, use null.
7. Respond ONLY with valid JSON, no markdown, no explanation.

Available categories: ${JSON.stringify(categoryList)}`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: imageContents },
        ],
        response_format: { type: 'json_object' },
    });

    const inputTokens = response.usage?.prompt_tokens ?? null;
    const outputTokens = response.usage?.completion_tokens ?? null;
    const rawContent = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(rawContent);

    if (parsed.status === 400) {
        await updateStatementAndJob(statementId, 9);
        await auditRepo.create({
            statement_id: statementId,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            raw_response: parsed,
            transactions_extracted: 0,
            status_id: 9,
        });
        console.log(`[INFO]: Statement ${statementId} — invalid image, status set to 9`);
        return;
    }

    const transactions: Array<{
        expense_category_id: string;
        merchant: string | null;
        transaction_date: string | null;
        parcels: number;
        parcel_value: number | null;
        total: number;
    }> = parsed.data ?? [];

    for (const tx of transactions) {
        await transactionRepo.create(
            {
                expense_category_id: tx.expense_category_id,
                merchant: tx.merchant ?? undefined,
                transaction_date: tx.transaction_date ?? undefined,
                parcels: tx.parcels ?? 1,
                parcel_value: tx.parcel_value ?? undefined,
                total_value: tx.total,
            },
            statement.user_id,
            statementId,
        );
    }

    const extractedTotal = transactions.reduce((sum, tx) => sum + (tx.total ?? 0), 0);
    const diff = Math.abs(extractedTotal - (statement.total ?? 0));
    const finalStatus = diff <= TOTAL_TOLERANCE ? 4 : 7;

    await updateStatementAndJob(statementId, finalStatus);

    await auditRepo.create({
        statement_id: statementId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        raw_response: parsed,
        transactions_extracted: transactions.length,
        status_id: finalStatus,
    });

    console.log(`[INFO]: Statement ${statementId} processed — status: ${finalStatus}, transactions: ${transactions.length}`);
}

async function startWorker() {
    await AppDataSource.initialize();
    await connectRabbitMQ();

    consumeFromExchange(
        EXCHANGE,
        ROUTING_KEY,
        QUEUE,
        processMessage,
        { maxRetries: MAX_RETRIES, retryDelay: RETRY_DELAY },
    );

    console.log(`[INFO]: statement-processor worker started — listening on ${QUEUE}`);
}

startWorker().catch((err) => {
    console.error('[FATAL]: Failed to start worker:', err);
    process.exit(1);
});
