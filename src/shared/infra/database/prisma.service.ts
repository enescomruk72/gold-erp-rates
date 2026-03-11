import type { PoolConfig } from 'pg';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from '@/config/env.config';
import { Logger } from '@/shared/infra/logger';

// 1. Postgres Connection Pool
const poolConfig: PoolConfig = {
  connectionString: env.databaseUrl,
  max: env.isProduction ? 20 : 5,
};

const pool = new Pool(poolConfig);

// 2. Adapter
const adapter = new PrismaPg(pool as any);

// 3. Global Cache
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const client = new PrismaClient({
    adapter,
    log: env.isDevelopment ? ['warn', 'error'] : ['warn', 'error'],
    errorFormat: env.isDevelopment ? 'pretty' : 'minimal',
  });

  return client;
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

pool.on('error', (err: unknown) => {
  Logger.error('❌ Postgres Pool Error', err);
  process.exit(-1);
});

