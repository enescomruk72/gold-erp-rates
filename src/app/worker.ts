import { Logger } from '@/shared/infra/logger';
import { rateSyncWorker } from '@/jobs/rate-sync.worker';
import { scheduleRateSyncJob } from '@/jobs/rate-sync.job';
import { startPriceSocketClient, stopPriceSocketClient } from '@/socket/price-socket.client';

async function bootstrap() {
  Logger.info('🚀 Rate-service worker process starting...');

  await scheduleRateSyncJob();
  startPriceSocketClient();

  const shutdown = async (signal: string) => {
    Logger.info(`${signal} received, shutting down...`);
    stopPriceSocketClient();
    await rateSyncWorker.close();
    Logger.info('✅ Worker closed gracefully');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  Logger.info('👀 Listening for rate-sync jobs (event-based + POST /rates/sync)');
}

bootstrap().catch((err) => {
  Logger.error('❌ Worker bootstrap failed', err);
  process.exit(1);
});

