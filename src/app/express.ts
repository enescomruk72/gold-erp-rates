import express, { type Application } from 'express';
import helmet from 'helmet';
import compression from 'compression';

import { env } from '../config/env.config';
import { Logger } from '../shared/infra/logger';
import { apiTokenMiddleware } from '../infra/http/middleware/api-token.middleware';
import { ratesRouter } from '../modules/rates/rates.routes';
import { globalErrorHandler } from '../infra/http/middleware/error.middleware';

export const createExpressApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(compression());

  app.use(express.json({ limit: '1mb' }));

  app.use((req, _res, next) => {
    Logger.info(`Incoming Request: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      ip: req.ip,
    });
    next();
  });

  // Health token gerektirmez (load balancer / k8s probe için)
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      env: env.nodeEnv,
      service: 'gold-erp-rate-service',
    });
  });

  // Aşağıdaki tüm route'lar x-api-token ister
  app.use(apiTokenMiddleware);

  app.use('/rates', ratesRouter);

  app.use(globalErrorHandler);

  return app;
};

