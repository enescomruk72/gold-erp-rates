import { Job, Worker } from 'bullmq';
import { Logger } from '@/shared/infra/logger';
import { env } from '@/config/env.config';
import { syncRatesFromSocketPayload } from '@/modules/rates/rates.service';
import { waitForValidPricePayload } from '@/socket/price-payload-buffer';
import { restartPriceSocketClientForSync } from '@/socket/price-socket.client';
import type { RateSyncJobPayload } from './rate-sync.queue';

export const rateSyncWorker = new Worker<RateSyncJobPayload>(
  'rate-sync',
  async (job: Job<RateSyncJobPayload>) => {
    Logger.info(`🔁 [RateSyncWorker] Processing job ${job.id}`, { reason: job.data.reason });

    if (job.data.reason === 'SCHEDULED' || job.data.reason === 'MANUAL') {
      await restartPriceSocketClientForSync();
    }

    const timeoutMs = env.rateSyncWaitTimeoutMs;
    const payload = await waitForValidPricePayload(timeoutMs);

    const result = await syncRatesFromSocketPayload(payload, {
      writeSnapshots: true,
      snapshotReason: job.data.reason,
    });
    Logger.info(
      `💾 Synced ${result.updated} symbols from socket payload with snapshots (reason=${job.data.reason})`,
    );
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

