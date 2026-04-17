import pkg from 'pg';
const { Pool } = pkg;

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('缺少數據庫連接字符串');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

const RATE_LIMIT = 100;
const RATE_WINDOW = 3600 * 1000;
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  rateLimitMap.set(ip, record);
  return true;
}

// Server-side memory cache (30s TTL)
const cache = new Map();
const CACHE_TTL = 30000;

async function fetchYahooChart(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const prevClose = closes.length >= 2 ? closes[closes.length - 2] : meta.chartPreviousClose;
    const currentPrice = meta.regularMarketPrice;
    if (!currentPrice) return null;
    const change = currentPrice - (prevClose || 0);
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;
    return {
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      previousClose: prevClose,
    };
  } catch {
    return null;
  }
}

// Symbol mapping: id -> Yahoo Finance symbol
const REALTIME_SYMBOLS = {
  US: {
    vix: { symbol: '^VIX', label: 'VIX', format: '2dp', unit: '', note: '恐慌指數' },
    spx: { symbol: 'ES=F', label: 'S&P 500', format: '2dp', unit: '', note: '期貨' },
    tnx: { symbol: '^TNX', label: '10Y 債息', format: '2dp', unit: '%', note: '十年期美債' },
    dxy: { symbol: 'DX-Y.NYB', label: 'DXY', format: '2dp', unit: '', note: '美元指數' },
  },
  HK: {
    hsi: { symbol: '^HSI', label: '恒指', format: '2dp', unit: '', note: '恒生指數' },
    vhsi: { symbol: '^VHSI', label: 'VHSI', format: '2dp', unit: '', note: '恒指波幅' },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(String(ip))) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const market = req.query.market || 'US';

    // Check cache
    const cacheKey = `market-data-${market}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.status(200).json(cached.data);
    }

    // Fetch real-time data from Yahoo Finance
    const symbols = REALTIME_SYMBOLS[market] || REALTIME_SYMBOLS.US;
    const yahooFetches = Object.entries(symbols).map(async ([id, config]) => {
      const data = await fetchYahooChart(config.symbol);
      return { id, ...config, ...data };
    });

    const realtimeResults = await Promise.all(yahooFetches);

    // Fetch DB macros (Core PCE, etc.) as non-realtime supplements
    let dbMacros = [];
    try {
      const dbResult = await query(
        'SELECT name, value, trend, status, note FROM macros WHERE market = $1 ORDER BY id',
        [market]
      );
      dbMacros = dbResult.rows.map(r => ({
        id: r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        label: r.name,
        value: r.value,
        trend: r.trend,
        status: r.status,
        note: r.note,
        type: 'db',
      }));
    } catch {
      // DB query failed, continue with real-time only
    }

    // Merge: real-time data takes priority, DB fills gaps
    const mergedMacros = [];

    // Add real-time data first
    for (const item of realtimeResults) {
      if (item.price != null) {
        mergedMacros.push({
          id: item.id,
          label: item.label,
          value: `${item.unit === '%' ? '' : ''}${item.price.toFixed(2)}${item.unit}`,
          numericValue: item.price,
          change: item.change,
          changePercent: item.changePercent,
          trend: item.change >= 0 ? 'up' : 'down',
          status: item.id === 'vix'
            ? (item.price > 25 ? 'hot' : item.price > 18 ? 'warn' : 'normal')
            : item.changePercent < -1 ? 'hot' : item.changePercent < -0.3 ? 'warn' : 'normal',
          type: 'realtime',
          note: item.note,
          unit: item.unit,
          symbol: item.symbol,
        });
      }
    }

    // Add DB macros that aren't already covered by real-time
    const realtimeIds = new Set(mergedMacros.map(m => m.id));
    for (const dbMacro of dbMacros) {
      if (!realtimeIds.has(dbMacro.id) && !realtimeIds.has(dbMacro.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))) {
        mergedMacros.push({ ...dbMacro, type: 'db' });
      }
    }

    const result = {
      success: true,
      data: {
        macros: mergedMacros,
        realtime: realtimeResults.some(r => r.price != null),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        market,
        source: 'Yahoo Finance + PostgreSQL',
      },
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return res.status(200).json(result);

  } catch (error) {
    console.error('API Error - /market-data:', error.message);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}