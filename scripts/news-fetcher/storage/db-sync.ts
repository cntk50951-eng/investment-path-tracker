import pkg from 'pg';
import type { NewsItem } from '../types';
import { logger } from '../utils/logger';

const { Pool } = pkg;

let pool: pkg.Pool | null = null;

function getPool(): pkg.Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('缺少 POSTGRES_URL 或 DATABASE_URL 環境變數');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

async function query(text: string, params: any[]) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

const IRRELEVANT_CATEGORIES = [
  'sports', 'entertainment', 'celebrity', 'gaming', 'lifestyle',
  'fashion', 'food', 'travel', 'weather', 'obituary',
];

const IRRELEVANT_TITLE_KEYWORDS = [
  'IPL', 'cricket score', 'football match result', 'premier league table',
  'la liga result', 'serie a result', 'bundesliga result',
  'NBA game', 'NFL game', 'MLB game', 'NHL game', 'tennis match', 'golf tournament',
  'boxing fight', 'UFC fight', 'MMA fight', 'wrestling match',
  'movie review:', 'album review:', 'TV show', 'reality show', 'celebrity gossip',
  'recipe:', 'cooking show', 'fashion week', 'lottery winner', 'powerball', 'mega millions',
  'horoscope', 'zodiac sign',
  'weather forecast', 'weather outlook', 'first alert forecast', 'first warning forecast',
  'weather update', 'weather alert', 'rain expected', 'storm alert',
  'temperature forecast', 'weekend weather',
  'obituary', 'funeral service', 'missing person alert', 'police hunt dangerous',
  'drinking water warning', 'viral video of', 'tiktok trend',
];

function isRelevantNews(item: NewsItem): boolean {
  const category = (item.category || '').toLowerCase();
  const title = (item.title || '').toLowerCase();

  for (const cat of IRRELEVANT_CATEGORIES) {
    if (category.includes(cat)) return false;
  }
  for (const kw of IRRELEVANT_TITLE_KEYWORDS) {
    if (title.includes(kw.toLowerCase())) return false;
  }
  return true;
}

function inferSeverity(item: NewsItem): string {
  const text = ((item.title || '') + ' ' + (item.summary || '')).toLowerCase();
  if (/crisis|crash|collapse|war|conflict|sanction|tariff|recession|inflation surge/i.test(text)) {
    return 'critical';
  }
  if (/fed|interest rate|cpi|gdp|unemployment|trade war|central bank/i.test(text)) {
    return 'medium';
  }
  return 'medium';
}

function inferMarket(item: NewsItem): string {
  // Use explicit region from source if available
  if (item.region) {
    if (item.region === 'hk' || item.region === 'HK') return 'HK';
    if (item.region === 'cn' || item.region === 'CN') return 'HK'; // Chinese news goes to HK market
    if (item.region === 'us' || item.region === 'US') return 'US';
    if (item.region === 'tw' || item.region === 'TW') return 'HK'; // Taiwan news goes to HK market
  }
  
  // Fallback to keyword detection
  const text = ((item.title || '') + ' ' + (item.summary || '')).toLowerCase();
  if (/hang seng|hong kong|港股|恆生|hsbc|hk stock|hsi|中國|a股|上證|深圳|創業板/i.test(text)) {
    return 'HK';
  }
  return 'US';
}

export interface SyncResult {
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
  irrelevant: number;
}

export async function syncNewsToDB(items: NewsItem[]): Promise<SyncResult> {
  if (!items || items.length === 0) {
    logger.info('📭 無新聞需要同步到 DB');
    return { inserted: 0, updated: 0, skipped: 0, total: 0, irrelevant: 0 };
  }

  const relevant = items.filter(isRelevantNews);
  const irrelevant = items.length - relevant.length;
  logger.info(`🗄️ DB 同步：${items.length} 條 → 過濾後 ${relevant.length} 條財經新聞（移除 ${irrelevant} 條無關）`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  const BATCH_SIZE = 50;

  for (let i = 0; i < relevant.length; i += BATCH_SIZE) {
    const batch = relevant.slice(i, i + BATCH_SIZE);
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIdx = 1;

    for (const item of batch) {
      const id = item.id;
      const title = (item.title || '').substring(0, 500);
      const source = (item.source || 'unknown').substring(0, 200);
      const severity = inferSeverity(item);
      const market = inferMarket(item);
      const summary = (item.summary || item.content || '').substring(0, 2000);
      const url = (item.url || '').substring(0, 500);

      let date: string;
      try {
        const publishTime = item.publish_time || item.fetch_time;
        date = publishTime ? new Date(publishTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      } catch {
        date = new Date().toISOString().split('T')[0];
      }

      let publishedTime: string | null = null;
      try {
        if (item.publish_time) {
          const d = new Date(item.publish_time);
          publishedTime = `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
        }
      } catch {}

      placeholders.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, $${paramIdx + 7}, $${paramIdx + 8})`);
      values.push(id, market, date, title, source, severity, summary, url, publishedTime);
      paramIdx += 9;
    }

    try {
      const queryText = `
        INSERT INTO news (id, market, date, title, source, severity, summary, url, published_time)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          market = EXCLUDED.market,
          date = EXCLUDED.date,
          title = EXCLUDED.title,
          source = EXCLUDED.source,
          severity = EXCLUDED.severity,
          summary = EXCLUDED.summary,
          url = EXCLUDED.url,
          published_time = EXCLUDED.published_time,
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0)::int AS is_insert
      `;

      const result = await query(queryText, values);

      for (const row of result.rows) {
        if (row.is_insert === 1) {
          inserted++;
        } else {
          updated++;
        }
      }
    } catch (e: any) {
      logger.error(`⚠️ DB batch 同步出錯: ${e.message}`);
      skipped += batch.length;
    }

    const progress = Math.min(i + BATCH_SIZE, relevant.length);
    if (progress % 50 === 0 || progress >= relevant.length) {
      logger.info(`  DB 進度: ${progress}/${relevant.length} (插入: ${inserted}, 更新: ${updated}, 跳過: ${skipped})`);
    }
  }

  const result: SyncResult = { inserted, updated, skipped, total: relevant.length, irrelevant };
  logger.info(`✅ DB 同步完成: 插入 ${inserted}, 更新 ${updated}, 跳過 ${skipped}, 總計 ${relevant.length} 條`);

  try {
    const countResult = await query('SELECT COUNT(*) as total, MIN(date) as earliest, MAX(date) as latest FROM news', []);
    logger.info(`📈 DB 狀態: ${countResult.rows[0].total} 條新聞, 日期範圍 ${countResult.rows[0].earliest} ~ ${countResult.rows[0].latest}`);
  } catch {
    // Ignore status check failure
  }

  return result;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}