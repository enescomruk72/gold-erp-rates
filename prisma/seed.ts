import { prisma } from '../src/shared/infra/database/prisma.service';

type SocketPriceChangedPayload = {
  meta: {
    time: number;
    tarih?: string;
  };
  data: Record<
    string,
    {
      code?: string;
      alis: string | number;
      satis: string | number;
      tarih: string;
      dusuk: string | number | null;
      yuksek: string | number | null;
      kapanis: number;
      dir: {
        alis_dir: string;
        satis_dir: string;
      };
    }
  >;
};

const samplePriceChangedPayload: SocketPriceChangedPayload = {
  meta: {
    time: 1773251617428,
    tarih: '11-03-2026 20:53:37',
  },
  data: {
    USDTRY: {
      code: 'USDTRY',
      alis: '44.0060',
      satis: '44.0800',
      tarih: '11-03-2026 20:53:23',
      dusuk: '44.0390',
      yuksek: '44.1310',
      kapanis: 44.081,
      dir: {
        alis_dir: '',
        satis_dir: '',
      },
    },
    EURTRY: {
      code: 'EURTRY',
      alis: '50.8040',
      satis: '50.9700',
      tarih: '11-03-2026 20:53:36',
      dusuk: '50.9460',
      yuksek: '51.2780',
      kapanis: 51.142,
      dir: {
        alis_dir: 'up',
        satis_dir: 'down',
      },
    },
    GBPTRY: {
      code: 'GBPTRY',
      alis: 58.677,
      satis: 59.089,
      tarih: '11-03-2026 20:53:37',
      dusuk: 59.032,
      yuksek: 59.323,
      kapanis: 59.13,
      dir: {
        alis_dir: '',
        satis_dir: '',
      },
    },
    ALTIN: {
      code: 'ALTIN',
      alis: '7367.070',
      satis: '7401.730',
      tarih: '11-03-2026 20:53:37',
      dusuk: '7376.370',
      yuksek: '7475.650',
      kapanis: 7431.66,
      dir: {
        alis_dir: 'down',
        satis_dir: 'down',
      },
    },
    ONS: {
      code: 'ONS',
      alis: '5166.50',
      satis: '5167.00',
      tarih: '11-03-2026 20:53:37',
      dusuk: '5150.30',
      yuksek: '5222.30',
      kapanis: 5195.1,
      dir: {
        alis_dir: 'down',
        satis_dir: '',
      },
    },
    EURUSD: {
      code: 'EURUSD',
      alis: 1.1545,
      satis: 1.1563,
      tarih: '11-03-2026 20:53:34',
      dusuk: 1.1556,
      yuksek: 1.1632,
      kapanis: 1.1602,
      dir: {
        alis_dir: '',
        satis_dir: 'down',
      },
    },
    GBPUSD: {
      code: 'GBPUSD',
      alis: '1.3330',
      satis: '1.3400',
      tarih: '11-03-2026 20:53:37',
      dusuk: '1.3390',
      yuksek: '1.3450',
      kapanis: 1.341,
      dir: {
        alis_dir: '',
        satis_dir: 'down',
      },
    },
    USDJPY: {
      code: 'USDJPY',
      alis: '159.15650',
      satis: '161.07300',
      tarih: '11-03-2026 20:53:36',
      dusuk: '160.08300',
      yuksek: '161.16200',
      kapanis: 160.275,
      dir: {
        alis_dir: 'up',
        satis_dir: 'up',
      },
    },
    KULCEALTIN: {
      code: 'KULCEALTIN',
      alis: 7330.23,
      satis: 7438.74,
      tarih: '11-03-2026 20:53:37',
      dusuk: 7413.25,
      yuksek: 7513.03,
      kapanis: 7468.82,
      dir: {
        alis_dir: 'down',
        satis_dir: 'down',
      },
    },
    GUMUSTRY: {
      code: 'GUMUSTRY',
      alis: 118.261,
      satis: 124.887,
      tarih: '11-03-2026 20:53:37',
      dusuk: 124.003,
      yuksek: 130.922,
      kapanis: 129.738,
      dir: {
        alis_dir: 'down',
        satis_dir: 'down',
      },
    },
    XAGUSD: {
      code: 'XAGUSD',
      alis: 85.09,
      satis: 85.12,
      tarih: '11-03-2026 20:53:37',
      dusuk: 84.48,
      yuksek: 89.32,
      kapanis: 88.54,
      dir: {
        alis_dir: '',
        satis_dir: 'down',
      },
    },
    XPTUSD: {
      code: 'XPTUSD',
      alis: 2175,
      satis: 2181,
      tarih: '11-03-2026 20:53:37',
      dusuk: 2167,
      yuksek: 2237,
      kapanis: 2205,
      dir: {
        alis_dir: 'down',
        satis_dir: 'down',
      },
    },
    XPDUSD: {
      code: 'XPDUSD',
      alis: 1630,
      satis: 1634,
      tarih: '11-03-2026 20:53:37',
      dusuk: 1632,
      yuksek: 1691,
      kapanis: 1668,
      dir: {
        alis_dir: '',
        satis_dir: '',
      },
    },
    PLATIN: {
      code: 'PLATIN',
      alis: 64930,
      satis: 70120,
      tarih: '11-03-2026 20:53:37',
      dusuk: 69670,
      yuksek: 71910,
      kapanis: 70900,
      dir: {
        alis_dir: 'down',
        satis_dir: 'down',
      },
    },
    PALADYUM: {
      code: 'PALADYUM',
      alis: 42420,
      satis: 52540,
      tarih: '11-03-2026 20:53:37',
      dusuk: 52460,
      yuksek: 54380,
      kapanis: 53620,
      dir: {
        alis_dir: 'up',
        satis_dir: 'up',
      },
    },
  },
};

type ParsedSymbol = {
  baseCurrency: string;
  quoteCurrency: string;
};

function parseCodeToPair(code: string): ParsedSymbol {
  // Basit kurallar:
  // - Sonu TRY ise: XXXTRY -> base = XXX, quote = TRY
  // - Sonu USD ise: XXXUSD -> base = XXX, quote = USD
  // - Sonu JPY ise: XXXJPY -> base = XXX, quote = JPY
  // - Sonu KG  ise: XXXKG  -> base = XXX, quote = KG
  // - Diğerleri için: base = code, quote = "N/A"

  if (code.endsWith('TRY')) {
    return { baseCurrency: code.slice(0, -3), quoteCurrency: 'TRY' };
  }

  if (code.endsWith('USD')) {
    return { baseCurrency: code.slice(0, -3), quoteCurrency: 'USD' };
  }

  if (code.endsWith('JPY')) {
    return { baseCurrency: code.slice(0, -3), quoteCurrency: 'JPY' };
  }

  if (code.endsWith('KG')) {
    return { baseCurrency: code.slice(0, -2), quoteCurrency: 'KG' };
  }

  return { baseCurrency: code, quoteCurrency: 'N/A' };
}

async function main() {
  const source = await prisma.rateSource.upsert({
    where: { code: 'SOCKET_PRICE_CHANGED' },
    update: {},
    create: {
      code: 'SOCKET_PRICE_CHANGED',
      name: 'Socket price_changed',
      description: 'Socket price_changed eventi ile gelen kur sağlayıcı',
      meta: samplePriceChangedPayload.meta,
    },
  });

  const priceChangedType = await prisma.rateType.upsert({
    where: {
      sourceId_code: {
        sourceId: source.id,
        code: 'PRICE_CHANGED',
      },
    },
    update: {},
    create: {
      sourceId: source.id,
      code: 'PRICE_CHANGED',
      name: 'price_changed',
      meta: {
        eventName: 'price_changed',
        payloadShape: 'meta{time,tarih?}, data{code,alis,satis,tarih,dusuk,yuksek,kapanis,dir{alis_dir,satis_dir}}',
      },
    },
  });

  for (const [code, value] of Object.entries(samplePriceChangedPayload.data)) {
    const { baseCurrency, quoteCurrency } = parseCodeToPair(code);

    const symbol = await prisma.rateSymbol.upsert({
      where: {
        rateTypeId_baseCurrency_quoteCurrency: {
          rateTypeId: priceChangedType.id,
          baseCurrency,
          quoteCurrency,
        },
      },
      update: {
        lastValue: Number(value.satis ?? value.alis),
        lastUpdatedAt: new Date(),
      },
      create: {
        rateTypeId: priceChangedType.id,
        baseCurrency,
        quoteCurrency,
        lastValue: Number(value.satis ?? value.alis),
        lastUpdatedAt: new Date(),
      },
    });

    await prisma.rateSnapshot.create({
      data: {
        symbolId: symbol.id,
        value: Number(value.satis ?? value.alis),
        raw: value as any,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

