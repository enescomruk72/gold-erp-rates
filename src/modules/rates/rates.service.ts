import { prisma } from '../../shared/infra/database/prisma.service';

const ISTANBUL_TZ = 'Europe/Istanbul';

/** Socket price_changed event payload tipi */
export type SocketPriceItem = {
  code?: string;
  alis: string | number;
  satis: string | number;
  tarih: string;
  dusuk: string | number | null;
  yuksek: string | number | null;
  kapanis: number;
  dir: { alis_dir: string; satis_dir: string };
};

export type SocketPriceChangedPayload = {
  meta: { time: number; tarih?: string };
  data: Record<string, SocketPriceItem>;
};

function parseCodeToPair(code: string): { baseCurrency: string; quoteCurrency: string } {
  if (code.endsWith('TRY')) return { baseCurrency: code.slice(0, -3), quoteCurrency: 'TRY' };
  if (code.endsWith('USD')) return { baseCurrency: code.slice(0, -3), quoteCurrency: 'USD' };
  if (code.endsWith('JPY')) return { baseCurrency: code.slice(0, -3), quoteCurrency: 'JPY' };
  if (code.endsWith('KG')) return { baseCurrency: code.slice(0, -2), quoteCurrency: 'KG' };
  return { baseCurrency: code, quoteCurrency: 'N/A' };
}

/** "11-03-2026 21:45:32" (TR) -> Date (UTC'ye çevrilir) */
function parseTarih(tarih: string): Date {
  if (!tarih || !tarih.trim()) return new Date();
  const [datePart, timePart] = tarih.trim().split(/\s+/);
  if (!datePart || !timePart) return new Date();
  const [d, m, y] = datePart.split('-');
  if (!d || !m || !y) return new Date();
  const iso = `${y}-${m}-${d}T${timePart}+03:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/** Gelen payload'u { meta, data } formatına getirir. Socket bazen [ "price_changed", { meta, data } ] veya sadece data yollar. */
function normalizePayload(raw: unknown): SocketPriceChangedPayload {
  const defaultMeta: { time: number; tarih?: string } = { time: Date.now() };
  const unwrap =
    Array.isArray(raw) && raw.length >= 2 && raw[1] && typeof raw[1] === 'object' ? raw[1] : raw;

  if (unwrap && typeof unwrap === 'object' && 'data' in unwrap) {
    const o = unwrap as { meta?: { time?: number; tarih?: string }; data?: Record<string, SocketPriceItem> };
    if (o.data && typeof o.data === 'object') {
      const meta: { time: number; tarih?: string } =
        o.meta && typeof o.meta.time === 'number'
          ? { time: o.meta.time, ...(o.meta.tarih != null && { tarih: o.meta.tarih }) }
          : defaultMeta;
      return { meta, data: o.data };
    }
  }
  if (unwrap && typeof unwrap === 'object' && unwrap !== null && !('data' in unwrap)) {
    const data = unwrap as Record<string, SocketPriceItem>;
    if (typeof data === 'object' && (data.USDTRY || data.EURTRY || data.ALTIN || data.ONS)) {
      return { meta: defaultMeta, data };
    }
  }
  throw new Error('Invalid payload: expected { meta, data } or data object with rate codes');
}

const MANDATORY_CODES = ['ALTIN', 'ONS'] as const;

/** Payload'un zorunlu sembolleri geçerli mi (sadece kontrol, throw etmez). Kuyruğa atmadan önce kullan. */
export function hasValidMandatoryPayload(raw: unknown): boolean {
  try {
    const normalized = normalizePayload(raw);
    for (const code of MANDATORY_CODES) {
      const item = normalized.data[code];
      if (!item) return false;
      const numSatis = Number(item.satis);
      const numAlis = Number(item.alis);
      const valueToUse = numSatis && numSatis > 0 ? numSatis : numAlis;
      if (!valueToUse || Number.isNaN(valueToUse) || valueToUse <= 0) return false;
      if (!item.tarih || !String(item.tarih).trim()) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Socket'ten gelen payload'u DB'ye yazar (RateSymbol + RateSnapshot günceller) */
export async function syncRatesFromSocketPayload(payload: SocketPriceChangedPayload | unknown): Promise<{ updated: number }> {
  const normalized = normalizePayload(payload);

  const missingOrInvalidMandatory: string[] = [];

  for (const code of MANDATORY_CODES) {
    const item = normalized.data[code];
    if (!item) {
      missingOrInvalidMandatory.push(code);
      continue;
    }
    const numSatis = Number(item.satis);
    const numAlis = Number(item.alis);
    const valueToUse = numSatis && numSatis > 0 ? numSatis : numAlis;
    if (!valueToUse || Number.isNaN(valueToUse) || valueToUse <= 0) {
      missingOrInvalidMandatory.push(code);
      continue;
    }
    if (!item.tarih || !item.tarih.trim()) {
      missingOrInvalidMandatory.push(code);
      continue;
    }
  }

  if (missingOrInvalidMandatory.length > 0) {
    throw new Error(`Mandatory symbols missing or invalid: ${missingOrInvalidMandatory.join(', ')}`);
  }

  const source = await prisma.rateSource.upsert({
    where: { code: 'SOCKET_PRICE_CHANGED' },
    update: { meta: normalized.meta as object },
    create: {
      code: 'SOCKET_PRICE_CHANGED',
      name: 'Socket price_changed',
      description: 'Socket price_changed eventi',
      meta: normalized.meta as object,
    },
  });

  const rateType = await prisma.rateType.upsert({
    where: {
      sourceId_code: { sourceId: source.id, code: 'PRICE_CHANGED' },
    },
    update: {},
    create: {
      sourceId: source.id,
      code: 'PRICE_CHANGED',
      name: 'price_changed',
      meta: { eventName: 'price_changed' },
    },
  });

  let updated = 0;
  for (const [code, value] of Object.entries(normalized.data)) {
    const numSatis = Number(value.satis);
    const numAlis = Number(value.alis);
    const valueToUse = numSatis && numSatis > 0 ? numSatis : numAlis;
    if (Number.isNaN(valueToUse) || valueToUse <= 0) continue;

    const { baseCurrency, quoteCurrency } = parseCodeToPair(code);
    const at = parseTarih(value.tarih);

    const symbol = await prisma.rateSymbol.upsert({
      where: {
        rateTypeId_baseCurrency_quoteCurrency: {
          rateTypeId: rateType.id,
          baseCurrency,
          quoteCurrency,
        },
      },
      update: { lastValue: valueToUse, lastUpdatedAt: at },
      create: {
        rateTypeId: rateType.id,
        baseCurrency,
        quoteCurrency,
        lastValue: valueToUse,
        lastUpdatedAt: at,
      },
    });

    await prisma.rateSnapshot.create({
      data: {
        symbolId: symbol.id,
        value: valueToUse,
        raw: value as object,
      },
    });
    updated += 1;
  }
  return { updated };
}

/** UTC Date'i İstanbul saatine çevirip ISO string döner (örn. 2026-03-11T21:42:30.274+03:00) */
function toIstanbulISO(date: Date | null): string | null {
  if (!date) return null;
  const t = new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ISTANBUL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(t);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const ms = t.getMilliseconds().toString().padStart(3, '0');
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.${ms}+03:00`;
}

/** GET /rates her bir kur için dönen öğe (socket payload ile uyumlu) */
export type RateItemResponse = {
  code: string;
  alis: string | number | null;
  satis: string | number | null;
  tarih: string | null;
  dusuk: string | number | null;
  yuksek: string | number | null;
  kapanis: string | number | null;
  dir: { alis_dir: string; satis_dir: string };
  lastUpdatedAt: string | null;
};

type GetLatestRatesInput = {
  sourceCode: string;
  typeCode: string;
  base?: string;
  quote?: string;
  /** Virgül ile ayrılmış code'lar (USDTRY, EURTRY, ALTIN vb.). Verilirse sadece bu kodlar döner. */
  codes?: string[];
};

/** Sembolün socket tarafındaki code değeri (USDTRY, ALTIN, ONS vb.) */
function symbolToCode(symbol: { baseCurrency: string; quoteCurrency: string }): string {
  return symbol.quoteCurrency === 'N/A'
    ? symbol.baseCurrency
    : `${symbol.baseCurrency}${symbol.quoteCurrency}`;
}

export async function getLatestRates(input: GetLatestRatesInput) {
  const { sourceCode, typeCode, base, quote, codes: requestedCodes } = input;

  const source = await prisma.rateSource.findUnique({
    where: { code: sourceCode },
  });

  if (!source) {
    return { sourceCode, typeCode, rates: [], requestedCodes: requestedCodes ?? null, notFound: requestedCodes ?? null };
  }

  const rateType = await prisma.rateType.findUnique({
    where: {
      sourceId_code: {
        sourceId: source.id,
        code: typeCode,
      },
    },
    include: {
      symbols: {
        include: {
          snapshots: {
            orderBy: { at: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!rateType) {
    return { sourceCode, typeCode, rates: [], requestedCodes: requestedCodes ?? null, notFound: requestedCodes ?? null };
  }

  let filtered = rateType.symbols.filter((symbol) => {
    if (base && symbol.baseCurrency !== base) return false;
    if (quote && symbol.quoteCurrency !== quote) return false;
    return true;
  });

  const codeSet =
    requestedCodes && requestedCodes.length > 0
      ? new Set(requestedCodes.map((c) => String(c).trim().toUpperCase()).filter(Boolean))
      : null;

  if (codeSet && codeSet.size > 0) {
    filtered = filtered.filter((s) => codeSet.has(symbolToCode(s)));
  }

  const notFound =
    codeSet && codeSet.size > 0
      ? [...codeSet].filter((code) => !filtered.some((s) => symbolToCode(s) === code))
      : null;

  const rates = filtered.map((symbol) => {
    const latestSnapshot = symbol.snapshots[0];
    const rawAt = latestSnapshot?.at ?? symbol.lastUpdatedAt;
    const lastUpdatedAt = rawAt ? toIstanbulISO(new Date(rawAt)) : null;
    const value = latestSnapshot?.value ?? symbol.lastValue;
    const numValue = value != null ? Number(value) : null;

    const raw = latestSnapshot?.raw as Record<string, unknown> | null | undefined;
    const hasRawFields =
      raw &&
      typeof raw === 'object' &&
      (raw.alis != null || raw.satis != null || raw.tarih != null);

    const code = symbolToCode(symbol);

    if (hasRawFields) {
      return {
        code,
        alis: raw.alis ?? numValue,
        satis: raw.satis ?? numValue,
        tarih: raw.tarih ?? null,
        dusuk: raw.dusuk ?? null,
        yuksek: raw.yuksek ?? null,
        kapanis: raw.kapanis ?? numValue,
        dir: raw.dir ?? { alis_dir: '', satis_dir: '' },
        lastUpdatedAt,
      };
    }

    return {
      code,
      alis: numValue,
      satis: numValue,
      tarih: null,
      dusuk: null,
      yuksek: null,
      kapanis: numValue,
      dir: { alis_dir: '', satis_dir: '' },
      lastUpdatedAt,
    };
  });

  return {
    sourceCode,
    typeCode,
    rates,
    requestedCodes: requestedCodes ?? null,
    notFound: notFound && notFound.length > 0 ? notFound : null,
  };
}

