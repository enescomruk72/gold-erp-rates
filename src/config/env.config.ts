import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const PORT = Number(process.env.API_PORT ?? 4010);
const HOSTNAME = process.env.HOSTNAME ?? 'localhost';

export const env = {
  nodeEnv: NODE_ENV,
  isDevelopment: NODE_ENV === 'development',
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test',
  port: PORT,
  hostname: HOSTNAME,
  apiToken: process.env.API_TOKEN ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  rateSyncIntervalMs: Number(process.env.RATE_SYNC_INTERVAL_MS ?? 10000),
  priceSocketUrl: process.env.PRICE_SOCKET_URL ?? '',
  priceSocketEventName: process.env.PRICE_SOCKET_EVENT_NAME ?? 'price_changed',
};

