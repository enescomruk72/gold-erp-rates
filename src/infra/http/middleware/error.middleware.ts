import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, UnexpectedError } from '@/shared/core/AppError';
import { Logger } from '@/shared/infra/logger';
import { ApiResponse } from '@/shared/infra/http/ApiResponse';

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const out: Record<string, unknown> = {
      name: err.name,
      message: err.message,
    };
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code) {
      out.code = err.code;
    }
    return out;
  }
  return { message: String(err) };
}

export const globalErrorHandler = (err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    if (err.isOperational) {
      Logger.warn(err.message, { code: err.code });
    } else {
      Logger.error(err.message, err);
    }

    return ApiResponse.error(res, err.message, err.statusCode, err.code, err.details);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    Logger.warn('[Prisma Validation]', { message: err.message });
    return ApiResponse.error(
      res,
      err.message || 'Prisma validation failed.',
      400,
      'PRISMA_VALIDATION_ERROR',
      serializeError(err),
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    Logger.warn(`[Prisma ${err.code}] ${err.message}`, { code: err.code });
    return ApiResponse.error(
      res,
      err.message,
      400,
      'PRISMA_KNOWN_REQUEST_ERROR',
      serializeError(err),
    );
  }

  const unexpected = new UnexpectedError(err);
  Logger.error('CRITICAL CRASH PREVENTED', unexpected);

  return ApiResponse.error(
    res,
    err?.message ?? 'An unexpected error occurred.',
    500,
    'INTERNAL_SERVER_ERROR',
    serializeError(err),
  );
};

