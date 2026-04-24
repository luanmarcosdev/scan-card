import 'dotenv/config';
import { connectRabbitMQ, getChannel } from '../infra/message-broker/rabbitmq';
import { AppDataSource } from '../infra/database/data-source';
import { JobRepositoryMySQL } from '../repositories/job.repository.mysql';
import { FailJobRepositoryMySQL } from '../repositories/fail-job.repository.mysql';
import { AuditLogRepositoryMySQL } from '../repositories/audit-log.repository.mysql';
import { CardStatementRepositoryMySQL } from '../repositories/card-statement.repository.mysql';

const DLQ_QUEUE = 'queue.dlq.all';

const jobRepo = new JobRepositoryMySQL();
const failJobRepo = new FailJobRepositoryMySQL();
const auditRepo = new AuditLogRepositoryMySQL();
const statementRepo = new CardStatementRepositoryMySQL();

async function processDLQMessage(raw: string, headers: Record<string, any>): Promise<void> {
    const payload = JSON.parse(raw) as { statementId?: string };
    const statementId = payload.statementId;

    const retries = (headers?.['x-retry-count'] ?? 0) as number;
    const errorMessage = headers?.['x-last-error'] ?? 'Max retries exceeded';

    const job = statementId ? await jobRepo.findByStatementId(statementId) : null;

    if (job) {
        await AppDataSource.transaction(async (manager) => {
            await manager.query(`UPDATE jobs SET status_id = 6 WHERE id = ?`, [job.id]);
            if (statementId) {
                await manager.query(`UPDATE card_statements SET status_id = 6 WHERE id = ?`, [statementId]);
            }
        });

        await failJobRepo.create({
            job_id: job.id,
            error_message: String(errorMessage),
        });

        if (statementId) {
            const statement = await statementRepo.findById(statementId);
            await auditRepo.create({
                statement_id: statementId,
                input_tokens: null,
                output_tokens: null,
                raw_response: { error: errorMessage, retries },
                transactions_extracted: null,
                status_id: 8,
                ip_address: statement?.ip_address ?? null,
            });
        }

        console.error(`[DLQ]: Statement ${statementId} — job ${job.id} moved to fail_jobs after ${retries} retries`);
    } else {
        console.error(`[DLQ]: Received message without recognizable job. Payload: ${raw}`);
    }

    // TODO: send alert email to DEVELOPER_EMAIL via Nodemailer
}

async function startWorker() {
    await AppDataSource.initialize();
    await connectRabbitMQ();

    const channel = getChannel();

    await channel.consume(DLQ_QUEUE, async (msg) => {
        if (msg) {
            try {
                await processDLQMessage(
                    msg.content.toString(),
                    msg.properties.headers ?? {},
                );
            } catch (err) {
                console.error('[DLQ-WORKER]: Failed to process DLQ message:', err);
            } finally {
                channel.ack(msg);
            }
        }
    }, { noAck: false });

    console.log(`[INFO]: dlq worker started — listening on ${DLQ_QUEUE}`);
}

startWorker().catch((err) => {
    console.error('[FATAL]: Failed to start dlq worker:', err);
    process.exit(1);
});
