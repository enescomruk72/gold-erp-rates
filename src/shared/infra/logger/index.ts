/* Minimal logger, backend ile uyumlu API */
class LoggerService {
  info(message: string, metadata?: Record<string, unknown>): void {
    console.info(message, metadata ?? {});
  }

  error(message: string, error?: unknown, metadata?: Record<string, unknown>): void {
    const payload = { ...(metadata ?? {}), error };
    console.error(message, payload);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    console.warn(message, metadata ?? {});
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    console.debug(message, metadata ?? {});
  }

  trace(message: string, metadata?: Record<string, unknown>): void {
    console.trace(message, metadata ?? {});
  }
}

export const Logger = new LoggerService();

