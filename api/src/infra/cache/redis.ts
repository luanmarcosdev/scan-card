import { createClient } from 'redis';

export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PASS,
});

redisClient.on('error', (err) => {
  console.error('[INFO]: Redis error:', err);
});

redisClient.on('ready', () => {
  console.log('[INFO]: Redis connected and ready!');
});

export async function connectRedis() {
  await redisClient.connect();
}