import { getChannel } from './rabbitmq';

export const publishToExchange = (exchange: string, routingKey: string, msg: string) => {
    const channel = getChannel();
    
    channel.assertExchange(exchange, 'topic', { durable: true });
    
    channel.publish(exchange, routingKey, Buffer.from(msg), { persistent: true });

    console.log(`[INFO]: Published to exchange "${exchange}" with key "${routingKey}": ${msg}`);
};