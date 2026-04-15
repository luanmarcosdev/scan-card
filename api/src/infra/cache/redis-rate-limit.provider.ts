import { IRateLimitProvider } from "../../contracts/rate-limit-provider.interface";
import { redisClient } from "./redis";

export class RedisRateLimitProvider implements IRateLimitProvider {
    async incr(key: string): Promise<number> {
        return await redisClient.incr(key);
    }
    async expire(key: string, ttlSeconds: number): Promise<void> {
        await redisClient.expire(key, ttlSeconds);
    }
}

