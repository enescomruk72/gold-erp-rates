import { Router } from 'express';
import { getRatesHandler, ingestRatesHandler, triggerRateSyncHandler } from './rates.controller';

export const ratesRouter = Router();

ratesRouter.get('/', getRatesHandler);
ratesRouter.post('/ingest', ingestRatesHandler);
ratesRouter.post('/sync', triggerRateSyncHandler);

