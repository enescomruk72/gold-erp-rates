import { io } from 'socket.io-client';
import { Logger } from '@/shared/infra/logger';
import { env } from '@/config/env.config';
import { rateSyncQueue } from '@/jobs/rate-sync.queue';
import { hasValidMandatoryPayload, type SocketPriceChangedPayload } from '@/modules/rates/rates.service';

let socket: ReturnType<typeof io> | null = null;

export function startPriceSocketClient(): void {
  if (!env.priceSocketUrl) {
    Logger.info('⏭  PRICE_SOCKET_URL not set, skipping socket client');
    return;
  }

  Logger.info(`🔌 Connecting to price socket: ${env.priceSocketUrl}`);

  socket = io(env.priceSocketUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    Logger.info('✅ Price socket connected');
  });

  socket.on('disconnect', (reason) => {
    Logger.warn('Price socket disconnected', { reason });
  });

  socket.on('connect_error', (err) => {
    Logger.error('Price socket connection error', err);
  });

  socket.on(env.priceSocketEventName, (payload: unknown) => {
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
      Logger.debug('price_changed event missing mandatory symbols (USDTRY,EURTRY,ALTIN,ONS), skipping enqueue');
      return;
    }
    Logger.info('📥 price_changed event received → enqueuing sync job');
    rateSyncQueue
      .add('rate-sync-event', { reason: 'EVENT', payload: raw as SocketPriceChangedPayload })
      .catch((err) => Logger.error('Failed to enqueue rate-sync job', err));
  });
}

export function stopPriceSocketClient(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    Logger.info('Price socket client stopped');
  }
}
