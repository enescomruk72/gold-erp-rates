import { Job, Worker } from 'bullmq';
import { prisma } from '@/shared/infra/database/prisma.service';
import { Logger } from '@/shared/infra/logger';
import { env } from '@/config/env.config';
import { syncRatesFromSocketPayload } from '@/modules/rates/rates.service';
import type { RateSyncJobPayload } from './rate-sync.queue';

export const rateSyncWorker = new Worker<RateSyncJobPayload>(
  'rate-sync',
  async (job: Job<RateSyncJobPayload>) => {
    Logger.info(`🔁 [RateSyncWorker] Processing job ${job.id}`, { reason: job.data.reason });

    if (job.data.payload) {
      const result = await syncRatesFromSocketPayload(job.data.payload);
      Logger.info(`💾 Ingested ${result.updated} symbols from price_changed event`);
      return;
    }

    const symbols = await prisma.rateSymbol.findMany({
      where: {
        rateType: {
          source: { code: 'SOCKET_PRICE_CHANGED' },
          code: 'PRICE_CHANGED',
        },
      },
    });

    if (symbols.length > 0) {
      await prisma.rateSnapshot.createMany({
        data: symbols
          .filter((s) => s.lastValue !== null)
          .map((s) => ({
            symbolId: s.id,
            value: s.lastValue!,
            raw: {
              source: 'manual-tick',
              reason: job.data.reason,
            },
          })),
      });

      Logger.info(
        `💾 Saved ${symbols.length} rate snapshots for SOCKET_PRICE_CHANGED / PRICE_CHANGED`,
      );
    }
  },
  {
    connection: {
      url: env.redisUrl,
    },
    concurrency: 1,
  },
);

rateSyncWorker.on('completed', (job) => {
  Logger.debug(`✅ RateSync job completed: ${job.id}`);
});

rateSyncWorker.on('failed', (job, err) => {
  Logger.error(`❌ RateSync job failed: ${job?.id}`, err);
});

rateSyncWorker.on('error', (err) => {
  Logger.error('❌ RateSync worker error', err);
});

