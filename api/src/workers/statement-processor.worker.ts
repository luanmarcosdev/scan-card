import 'dotenv/config';
import OpenAI from 'openai';
import { connectRabbitMQ } from '../infra/message-broker/rabbitmq';
import { consumeFromExchange } from '../infra/message-broker/consumer';
import { AppDataSource } from '../infra/database/data-source';
import { CardStatementRepositoryMySQL } from '../repositories/card-statement.repository.mysql';
import { CardStatementImageRepositoryMySQL } from '../repositories/card-statement-image.repository.mysql';
import { CardTransactionRepositoryMySQL } from '../repositories/card-transaction.repository.mysql';
import { ExpenseCategoryRepositoryMySQL } from '../repositories/expense-category.repository.mysql';
import { JobRepositoryMySQL } from '../repositories/job.repository.mysql';
import { AuditLogRepositoryMySQL } from '../repositories/audit-log.repository.mysql';
import { OpenAIStatementExtractor } from '../infra/ai/openai-statement-extractor';
import { StatementProcessorService } from '../services/statement-processor.service';

const EXCHANGE = 'events';
const ROUTING_KEY = 'statement-ai-process';
const QUEUE = 'events.statement-ai-process';

const MAX_RETRIES = Number(process.env.RABBITMQ_STATEMENT_AI_MAX_RETRIES ?? 3);
const RETRY_DELAY = Number(process.env.RABBITMQ_STATEMENT_AI_RETRY_DELAY ?? 5000);

async function startWorker() {
    await AppDataSource.initialize();
    await connectRabbitMQ();

    const jobRepo = new JobRepositoryMySQL();

    const service = new StatementProcessorService(
        new CardStatementRepositoryMySQL(),
        new CardStatementImageRepositoryMySQL(),
        new CardTransactionRepositoryMySQL(),
        new ExpenseCategoryRepositoryMySQL(),
        jobRepo,
        new AuditLogRepositoryMySQL(),
        new OpenAIStatementExtractor(new OpenAI({ apiKey: process.env.OPENAI_API_KEY })),
    );

    consumeFromExchange(
        EXCHANGE,
        ROUTING_KEY,
        QUEUE,
        (raw) => {
            const { statementId } = JSON.parse(raw) as { statementId: string };
            return service.process(statementId);
        },
        {
            maxRetries: MAX_RETRIES,
            retryDelay: RETRY_DELAY,
            onRetry: async (raw) => {
                const { statementId } = JSON.parse(raw) as { statementId: string };
                const job = await jobRepo.findByStatementId(statementId);
                if (job) await jobRepo.incrementRetries(job.id);
            },
        },
    );

    console.log(`[INFO]: statement-processor worker started — listening on ${QUEUE}`);
}

startWorker().catch((err) => {
    console.error('[FATAL]: Failed to start worker:', err);
    process.exit(1);
});
