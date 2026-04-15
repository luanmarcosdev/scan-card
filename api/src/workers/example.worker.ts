import { connectRabbitMQ } from "../infra/message-broker/rabbitmq";
import { consumeFromExchange } from '../infra/message-broker/consumer';

async function startWorker() {
    await connectRabbitMQ(); 

    consumeFromExchange(
        'events',                           // nome da exchange
        'order',                            // routing key que esse worker escuta
        'luan',                             // nome da fila
        (msg) => {
            console.log(`[events.luan]: ${msg}`);
            throw new Error()
        }
    );
}

startWorker();