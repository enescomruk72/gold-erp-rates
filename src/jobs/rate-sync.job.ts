import { Logger } from '@/shared/infra/logger';
import { env } from '@/config/env.config';
import { rateSyncQueue } from './rate-sync.queue';

/** Eski repeatable job'ları kaldırır, sonra interval süresinde (örn. 10sn) tekrarlayan job ekler. */
export async function scheduleRateSyncJob() {
  try {
    const repeatable = await rateSyncQueue.getRepeatableJobs();
    for (const job of repeatable) {
      await rateSyncQueue.removeRepeatableByKey(job.key as string);
      Logger.info('Removed repeatable job', { key: String(job.key), name: String(job.name) } as Record<string, unknown>);
    }
  } catch (e) {
    Logger.warn('Could not list/remove repeatable jobs', { error: e });
  }

  const intervalMs = env.rateSyncIntervalMs;
  await rateSyncQueue.add(
    'rate-sync-interval',
    { reason: 'SCHEDULED' },
    { repeat: { every: intervalMs } },
  );
  Logger.info(`⏱  Rate sync: interval job every ${intervalMs}ms (event-based + scheduled)`);
}