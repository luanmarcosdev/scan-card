import { Channel } from 'amqplib';

const DLQ_EXCHANGE = 'dlq';
const DLQ_QUEUE = 'queue.dlq.all';

export const setupDLQ = async (channel: Channel) => {
    await channel.assertExchange(DLQ_EXCHANGE, 'topic', { durable: true });
    await channel.assertQueue(DLQ_QUEUE, { durable: true });
    await channel.bindQueue(DLQ_QUEUE, DLQ_EXCHANGE, '#.dlq');
};