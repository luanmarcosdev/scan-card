export interface IRateLimitProvider {
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<void>;
    ttl(key: string): Promise<number>;
}