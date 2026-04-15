// importa a biblioteca amqplib para se conectar ao RabbitMQ e trabalhar com canais
import amqp, { ChannelModel, Channel } from 'amqplib';
import { setupDLQ } from './setupDLQ'
import { setupRetry } from './setupRetry';

let connection: ChannelModel;
let channel: Channel;

export const getChannel = (): Channel => {
    if (!channel) {
        throw new Error("RabbitMQ Channel não inicializado.");
    }
    return channel;
};

export const connectRabbitMQ = async (): Promise<void> => {
    try {
        // modelo de conexao 'amqp://{usuario}:{senha}@{container OU host:porta}'
        // starta a conexao 
        connection = await amqp.connect('amqp://rabbit:rabbit@rabbitmq');
        console.log('[INFO]: Connected to RabbitMQ successfully!');
        // cria um canal para enviar e receber mensagens
        channel = await connection.createChannel();
        console.log('[INFO]: Channel created successfully!');
        // o consumer processa 1 mensagem por vez, só recebe a próxima após o ack
        await channel.prefetch(1);
        await setupDLQ(channel);
        await setupRetry(channel);
    } catch (err) {
        console.error('[ERROR]: Failed to connect to RabbitMQ:', err);
        throw err;
    }
};