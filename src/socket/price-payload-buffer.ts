import type { SocketPriceChangedPayload } from '@/modules/rates/rates.service';

type Resolver = (payload: SocketPriceChangedPayload) => void;

// Her sync job, kendisinden SONRA gelen ilk geçerli payload'ı bekler.
// Yani önceki değerler tekrar kullanılmaz.
const waiters = new Set<Resolver>();

export function notifyValidPricePayload(payload: SocketPriceChangedPayload): void {
  if (waiters.size === 0) return;

  for (const resolve of waiters) {
    resolve(payload);
  }
  waiters.clear();
}

export async function waitForValidPricePayload(timeoutMs: number): Promise<SocketPriceChangedPayload> {
  return await new Promise<SocketPriceChangedPayload>((resolve, reject) => {
    const resolver: Resolver = (payload) => {
      if (timer) clearTimeout(timer);
      resolve(payload);
    };

    waiters.add(resolver);

    const timer =
      timeoutMs > 0
        ? setTimeout(() => {
            waiters.delete(resolver);
            reject(new Error('Timed out waiting for valid price payload'));
          }, timeoutMs)
        : null;
  });
}

