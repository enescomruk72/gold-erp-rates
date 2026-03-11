import http from 'http';
import 'dotenv/config';
import { createExpressApp } from '@/app/express';
import { Logger } from '@/shared/infra/logger';
import { prisma } from '@/shared/infra/database/prisma.service';
import { env } from '@/config/env.config';

async function bootstrap() {
  Logger.info('🚀 Rate API Server starting...');

  try {
    await prisma.$connect();
    Logger.info('✅ Database connection established');
  } catch (error) {
    Logger.error('❌ Database connection failed', error);
    process.exit(1);
  }

  const app = createExpressApp();
  const server = http.createServer(app);

  server.listen(env.port, () => {
    Logger.info(`🚀 Rate service listening on port ${env.port} in ${env.nodeEnv} mode`);
    Logger.info(`🔗 Health Check: http://${env.hostname}:${env.port}/health`);
  });

  const shutdown = async (signal: string) => {
    Logger.info(`${signal} received. Closing HTTP server...`);

    server.close(async () => {
      Logger.info('HTTP server closed.');
      await prisma.$disconnect();
      Logger.info('✅ Prisma disconnected. Exiting.');
      process.exit(0);
    });

    setTimeout(() => {
      Logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('uncaughtException', (error) => {
  Logger.error('🔥 UNCAUGHT EXCEPTION! Server is unstable.', error);
});

process.on('unhandledRejection', (reason) => {
  Logger.error('💥 UNHANDLED REJECTION! Promise rejected.', reason);
});

bootstrap().catch((err) => {
  Logger.error('❌ Bootstrap failed', err);
  process.exit(1);
});

