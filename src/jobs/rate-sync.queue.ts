import { Queue } from 'bullmq';
import { Logger } from '@/shared/infra/logger';
import { env } from '@/config/env.config';
import type { SocketPriceChangedPayload } from '@/modules/rates/rates.service';

export interface RateSyncJobPayload {
  reason: 'SCHEDULED' | 'MANUAL' | 'EVENT';
  payload?: SocketPriceChangedPayload;
}

export const rateSyncQueue = new Queue<RateSyncJobPayload>('rate-sync', {
  connection: {
    url: env.redisUrl,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

rateSyncQueue.on('error', (err) => {
  Logger.error(`❌ RateSync Queue Error: ${err.message}`, err);
});

