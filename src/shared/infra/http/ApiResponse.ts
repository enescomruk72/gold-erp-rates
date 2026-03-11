import type { Response } from 'express';

export interface IResponseOptions<T> {
  success: boolean;
  message: string;
  data?: T | null;
  statusCode: number;
  type: string;
  timestamp: string;
}

export class ApiResponse {
  private static send<T>(res: Response, options: IResponseOptions<T>) {
    return res.status(options.statusCode).json(options);
  }

  public static success<T>(
    res: Response,
    data: T,
    message = 'Operation successful',
    statusCode = 200,
  ) {
    const body: IResponseOptions<T> = {
      success: true,
      message,
      data,
      statusCode,
      type: 'SUCCESS',
      timestamp: new Date().toISOString(),
    };

    return this.send(res, body);
  }

  public static error(
    res: Response,
    message: string,
    statusCode = 500,
    type = 'INTERNAL_SERVER_ERROR',
    errorDetails?: unknown,
  ) {
    const body: IResponseOptions<unknown> = {
      success: false,
      message,
      data: errorDetails || null,
      statusCode,
      type,
      timestamp: new Date().toISOString(),
    };

    return this.send(res, body);
  }
}

