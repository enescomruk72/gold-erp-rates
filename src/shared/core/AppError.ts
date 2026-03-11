import { env } from '@/config/env.config';

export interface IErrorResponse {
  message: string;
  statusCode: number;
  code: string;
  timestamp: string;
  details?: unknown;
  stack?: string | undefined;
}

export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly timestamp: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, isOperational = true, details?: unknown) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this);
  }

  public toJSON(): IErrorResponse {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      timestamp: this.timestamp,
      details: this.details,
      stack: env.isDevelopment ? this.stack : undefined,
    };
  }
}

export class UnexpectedError extends AppError {
  constructor(err: unknown) {
    super('An unexpected error occurred.', 500, 'INTERNAL_SERVER_ERROR', false, err);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', true, details);
  }
}

