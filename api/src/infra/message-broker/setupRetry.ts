import { Channel } from 'amqplib';

const RETRY_EXCHANGE = 'retry';

// cria a exchange de retry
// exporta para iniciar junto com a conexao do RabbitMQ
export const setupRetry = async (channel: Channel) => {
    await channel.assertExchange(RETRY_EXCHANGE, 'direct', { durable: true });
};

// cria uma fila de retry com TTL específico para cada fila principal
// ao expirar o TTL, a mensagem volta para a fila principal via dead-letter
export const assertRetryQueue = async (
    channel: Channel,
    queue: string,         // fila principal que vai receber de volta
    exchange: string,      // exchange principal
    routingKey: string,    // routing key principal
    ttl: number            // tempo de espera em ms
) => {
    const retryQueue = `${queue}.retry`;

    await channel.assertQueue(retryQueue, {
        durable: true,
        arguments: {
            'x-message-ttl': ttl,                        // tempo de espera
            'x-dead-letter-exchange': exchange,           // volta para exchange principal
            'x-dead-letter-routing-key': routingKey       // com a routing key original
        }
    });

    await channel.bindQueue(retryQueue, RETRY_EXCHANGE, routingKey);

    return retryQueue;
};