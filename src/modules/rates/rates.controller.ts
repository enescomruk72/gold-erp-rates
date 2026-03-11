import type { Request, Response, NextFunction } from 'express';
import { getLatestRates, type SocketPriceChangedPayload } from './rates.service';
import { ApiResponse } from '@/shared/infra/http/ApiResponse';
import { rateSyncQueue } from '@/jobs/rate-sync.queue';

export async function getRatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { sourceCode = 'SOCKET_PRICE_CHANGED', typeCode = 'PRICE_CHANGED', base, quote, code } = req.query;

    const codesParam = code != null ? String(code) : undefined;
    const codes =
      codesParam && codesParam.trim()
        ? codesParam
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean)
        : undefined;

    const result = await getLatestRates({
      sourceCode: String(sourceCode),
      typeCode: String(typeCode),
      base: base ? String(base) : '',
      quote: quote ? String(quote) : '',
      ...(codes && codes.length > 0 ? { codes } : {}),
    });

    const message =
      result.rates.length === 0 && result.notFound?.length
        ? 'None of the requested codes have data'
        : result.rates.length === 0
          ? 'No rates found'
          : 'Rates fetched successfully';

    return ApiResponse.success(res, result, message);
  } catch (error) {
    return next(error);
  }
}

/** Socket'ten gelen payload'u kuyruğa atar; worker DB'yi günceller. Backend socket dinleyip buraya POST edebilir. */
export async function ingestRatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as SocketPriceChangedPayload;
    if (!body?.data || typeof body.data !== 'object') {
      return ApiResponse.error(res, 'Invalid payload: expected { meta, data }', 400);
    }
    const payload: SocketPriceChangedPayload = {
      meta: body.meta ?? { time: Date.now() },
      data: body.data,
    };
    await rateSyncQueue.add('rate-sync-ingest', { reason: 'EVENT', payload });
    return ApiResponse.success(res, { queued: true }, 'Rates ingest job enqueued');
  } catch (error) {
    return next(error);
  }
}

export async function triggerRateSyncHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    await rateSyncQueue.add('rate-sync-manual', { reason: 'MANUAL' });
    return ApiResponse.success(res, { queued: true }, 'Rate sync job enqueued');
  } catch (error) {
    return next(error);
  }
}

