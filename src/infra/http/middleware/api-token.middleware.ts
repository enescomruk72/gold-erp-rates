import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '@/shared/core/AppError';
import { env } from '@/config/env.config';

const HEADER_NAME = 'x-api-token';

export function apiTokenMiddleware(req: Request, _res: Response, next: NextFunction) {
  const configuredToken = (env.apiToken ?? '').trim();

  if (!configuredToken) {
    return next(new UnauthorizedError('API Token not configured.'));
  }

  const raw = req.get(HEADER_NAME); // get() case-insensitive
  const token = typeof raw === 'string' ? raw.trim() : '';

  if (!token || token !== configuredToken) {
    return next(
      new UnauthorizedError(
        token
          ? 'Invalid API Token. Value does not match configured API_TOKEN.'
          : 'Invalid API Token. No token provided.',
      ),
    );
  }

  return next();
}

