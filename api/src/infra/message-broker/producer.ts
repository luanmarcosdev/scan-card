import { getChannel } from './rabbitmq';

export const publishToExchange = (exchange: string, routingKey: string, msg: string) => {
    const channel = getChannel();
    
    // Declara a exchange do tipo direct
    channel.assertExchange(exchange, 'direct', { durable: true });
    
    // Publica na exchange com a routing key
    // Diferente do sendToQueue que aponta para a exchange e não para a fila
    channel.publish(exchange, routingKey, Buffer.from(msg), { persistent: true });
    
    console.log(`[INFO]: Published to exchange "${exchange}" with key "${routingKey}": ${msg}`);
};