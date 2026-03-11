import Redis from 'ioredis';
import { env } from '@/config/env.config';
import { Logger } from '@/shared/infra/logger';

const REDIS_MAX_RETRIES = 15;

const globalForRedis = globalThis as unknown as { redis: Redis };

const createRedisClient = () => {
  const client = new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > REDIS_MAX_RETRIES) {
        Logger.error(
          `Redis connection failed after ${REDIS_MAX_RETRIES} attempts. Exiting.`,
        );
        setImmediate(() => process.exit(1));
        return null;
      }
      const delay = Math.min(times * 100, 3000);
      if (times <= 3 || times % 5 === 0) {
        Logger.warn(
          `Redis connection retry ${times}/${REDIS_MAX_RETRIES}, waiting ${delay}ms...`,
        );
      }
      return delay;
    },
  });

  client.on('connect', () => Logger.info('🚀 Redis Connected'));
  client.on('error', (err) => Logger.error('❌ Redis Connection Error', err));

  return client;
};

export const redis = globalForRedis.redis || createRedisClient();

if (!env.isProduction) {
  globalForRedis.redis = redis;
}

