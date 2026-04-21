import { getChannel } from './rabbitmq';
import { assertRetryQueue } from './setupRetry';

export const consumeFromExchange = async (
    exchange: string,
    routingKey: string,
    queue: string,
    handler: (msg: string) => void,
    options?: {
        maxRetries?: number;
        retryDelay?: number;
        onRetry?: (raw: string, retryCount: number) => Promise<void>;
    }
) => {
    const MAX_RETRIES = options?.maxRetries ?? 3;
    const RETRY_DELAY = options?.retryDelay ?? 5000;
    
    const channel = getChannel();

    await channel.assertExchange(exchange, 'topic', { durable: true });

    // cria a fila de retry apontando de volta para a fila principal
    await assertRetryQueue(channel, queue, exchange, routingKey, RETRY_DELAY);
	
    // configura dlq
    await channel.assertQueue(queue, {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': 'dlq',
            'x-dead-letter-routing-key': `${queue}.dlq`
        }
    });

    await channel.bindQueue(queue, exchange, routingKey);

    await channel.consume(queue, async (msg) => {
        if (msg) {
            // conta quantas vezes a mensagem já foi retentada
            const retries = (msg.properties.headers?.['x-retry-count'] ?? 0) as number;

            try {
                await handler(msg.content.toString());
                channel.ack(msg);
            } catch (err) {
		            // verifica numero de retry
                if (retries < MAX_RETRIES) {
                    const errorMessage = (err as Error).message ?? String(err);

                    channel.ack(msg);

                    channel.publish('retry', routingKey, msg.content, {
                        persistent: true,
                        headers: {
                            ...msg.properties.headers,
                            'x-retry-count': retries + 1,
                            'x-last-error': errorMessage,
                        }
                    });

                    if (options?.onRetry) {
                        await options.onRetry(msg.content.toString(), retries + 1);
                    }

                    console.warn(`[RETRY]: Tentativa ${retries + 1}/${MAX_RETRIES} | queue: ${queue}`);
                } else {
                    // esgotou tentativas → manda para DLQ
                    channel.nack(msg, false, false);
                    console.error(`[DLQ]: Esgotou tentativas | queue: ${queue}`);
                }
            }
        }
    }, { noAck: false });
};