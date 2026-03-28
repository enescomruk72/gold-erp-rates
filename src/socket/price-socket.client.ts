import { io, type Socket } from 'socket.io-client';
import { Logger } from '@/shared/infra/logger';
import { env } from '@/config/env.config';
import { hasValidMandatoryPayload, type SocketPriceChangedPayload } from '@/modules/rates/rates.service';
import { notifyValidPricePayload } from './price-payload-buffer';

let socket: Socket | null = null;

function createSocketOptions() {
  return {
    transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  };
}

function bindPriceSocketHandlers(s: Socket): void {
  s.on('connect', () => {
    Logger.info('✅ Price socket connected');
  });

  s.on('disconnect', (reason) => {
    Logger.warn('Price socket disconnected', { reason });
  });

  s.on('connect_error', (err) => {
    Logger.error('Price socket connection error', err);
  });

  s.on(env.priceSocketEventName, (payload: unknown) => {
    // Socket bazen [ "price_changed", { meta, data } ] şeklinde tek argüman yollar; gerçek payload 2. eleman
    const raw =
      Array.isArray(payload) && payload.length >= 2 && payload[1] && typeof payload[1] === 'object'
        ? payload[1]
        : payload;

    const hasData =
      raw &&
      typeof raw === 'object' &&
      ((raw as SocketPriceChangedPayload).data != null ||
        Object.prototype.hasOwnProperty.call(raw, 'USDTRY') ||
        Object.prototype.hasOwnProperty.call(raw, 'EURTRY'));
    if (!hasData) {
      Logger.warn('Invalid price_changed payload (no data), skipping');
      return;
    }
    if (!hasValidMandatoryPayload(raw)) {
      Logger.debug(
        'price_changed event missing mandatory symbols (USDTRY,EURTRY,ALTIN,ONS), skipping notify',
      );
      return;
    }
    const typedPayload = raw as SocketPriceChangedPayload;
    Logger.info('📥 price_changed event received → notifying waiting sync jobs');
    notifyValidPricePayload(typedPayload);
  });
}

function createAndBindPriceSocket(): Socket {
  const s = io(env.priceSocketUrl!, createSocketOptions());
  bindPriceSocketHandlers(s);
  return s;
}

export function startPriceSocketClient(): void {
  if (!env.priceSocketUrl) {
    Logger.info('⏭  PRICE_SOCKET_URL not set, skipping socket client');
    return;
  }

  Logger.info(`🔌 Connecting to price socket: ${env.priceSocketUrl}`);
  socket = createAndBindPriceSocket();
}

/**
 * Mevcut bağlantıyı kapatıp yeni socket açar; interval/manuel sync öncesi bayat oturumdan kaçınmak için.
 * İlk `connect` olayına kadar bekler (timeout: env.rateSyncSocketReconnectTimeoutMs).
 */
export async function restartPriceSocketClientForSync(): Promise<void> {
  if (!env.priceSocketUrl) return;

  stopPriceSocketClient();
  Logger.info('🔌 Price socket full reconnect before rate sync...');

  await new Promise<void>((resolve, reject) => {
    socket = createAndBindPriceSocket();
    const s = socket;
    const timeoutMs = env.rateSyncSocketReconnectTimeoutMs;

    const timer = setTimeout(() => {
      s.off('connect', onConnect);
      s.off('connect_error', onError);
      reject(new Error(`Price socket reconnect timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const onConnect = () => {
      clearTimeout(timer);
      s.off('connect_error', onError);
      Logger.info('✅ Price socket fresh session ready');
      resolve();
    };

    const onError = (err: Error) => {
      clearTimeout(timer);
      s.off('connect', onConnect);
      reject(err);
    };

    if (s.connected) {
      clearTimeout(timer);
      resolve();
      return;
    }

    s.once('connect', onConnect);
    s.once('connect_error', onError);
  });
}

export function stopPriceSocketClient(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    Logger.info('Price socket client stopped');
  }
}
