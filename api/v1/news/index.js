import pkg from 'pg';
const { Pool } = pkg;

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('缺少數據庫連接字符串：' + JSON.stringify({
        has_postgres_url: !!process.env.POSTGRES_URL,
        has_database_url: !!process.env.DATABASE_URL,
        node_env: process.env.NODE_ENV
      }));
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '僅支持 GET 請求' }
    });
  }
  
  try {
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(String(ip))) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: '請求頻率過高' }
      });
    }

const market = (req.query.market) || 'US';
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const severity = req.query.severity;
    const tag = req.query.tag;
    const path = req.query.path;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const conditions = ['market = $1'];
    const params = [market];
    let paramIndex = 2;

    if (severity) {
      conditions.push(`severity = $${paramIndex++}`);
      params.push(severity);
    }

    if (startDate) {
      conditions.push(`date >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`date <= $${paramIndex++}`);
      params.push(endDate);
    }

    if (tag) {
      const tagNewsResult = await query('SELECT DISTINCT news_id FROM news_tags WHERE tag = $1', [tag]);
      const tagNewsIds = tagNewsResult.rows.map(r => r.news_id);
      if (tagNewsIds.length > 0) {
        conditions.push(`id = ANY($${paramIndex++})`);
        params.push(tagNewsIds);
      } else {
        return res.status(200).json({
          success: true,
          data: { news: [], total: 0 },
          meta: { timestamp: new Date().toISOString(), version: '3.0.0', market, filters: { severity, tag, path } }
        });
      }
    }

    if (path) {
      const pathNewsResult = await query('SELECT DISTINCT news_id FROM news_related_paths WHERE path_id = $1', [path]);
      const pathNewsIds = pathNewsResult.rows.map(r => r.news_id);
      if (pathNewsIds.length > 0) {
        conditions.push(`id = ANY($${paramIndex++})`);
        params.push(pathNewsIds);
      } else {
        return res.status(200).json({
          success: true,
          data: { news: [], total: 0 },
          meta: { timestamp: new Date().toISOString(), version: '3.0.0', market, filters: { severity, tag, path } }
        });
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 查詢總數（使用與主查詢相同的條件，但不含 LIMIT/OFFSET）
    const countQuery = `
      SELECT COUNT(*) as total
      FROM news
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    let newsQuery = `
      SELECT id, market, date, title, source, severity, summary, impact, url, created_at, updated_at, published_time, affects
      FROM news
      ${whereClause}
      ORDER BY date DESC, published_time DESC
    `;
    
    // 添加分頁參數
    if (limit) {
      newsQuery += ` LIMIT $${paramIndex++}`;
      params.push(limit);
      newsQuery += ` OFFSET $${paramIndex++}`;
      params.push(offset);
    }

    const newsResult = await query(newsQuery, params);

    const news = await Promise.all(newsResult.rows.map(async (newsItem) => {
      const [affectsResult, pathsResult, tagsResult] = await Promise.all([
        query('SELECT switch_id FROM news_affects WHERE news_id = $1', [newsItem.id]),
        query('SELECT path_id FROM news_related_paths WHERE news_id = $1', [newsItem.id]),
        query('SELECT tag FROM news_tags WHERE news_id = $1', [newsItem.id]),
      ]);

      // Use relation table data if available, otherwise fallback to news.affects column
      let affects = affectsResult.rows.map(r => r.switch_id);
      if (affects.length === 0 && newsItem.affects) {
        // Parse comma-separated affects from news table (e.g., "be,bd")
        affects = newsItem.affects.split(',').map(s => s.trim()).filter(Boolean);
      }

      return {
        id: newsItem.id,
        market: newsItem.market,
        date: newsItem.date.toISOString().split('T')[0],
        createdAt: newsItem.created_at ? newsItem.created_at.toISOString() : null,
        publishedTime: newsItem.published_time || null,
        title: newsItem.title,
        source: newsItem.source,
        severity: newsItem.severity,
        summary: newsItem.summary,
        impact: newsItem.impact,
        url: newsItem.url,
        affects: affects,
        relatedPaths: pathsResult.rows.map(r => r.path_id),
        tags: tagsResult.rows.map(r => r.tag)
      };
    }));

    return res.status(200).json({
      success: true,
      data: { news, total, limit, offset, hasMore: offset + news.length < total },
      meta: {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        market,
        filters: { severity, tag, path, startDate, endDate, limit },
        source: 'PostgreSQL'
      }
    });

  } catch (error) {
    console.error('API Error - /news:', {
      message: error.message,
      has_postgres_url: !!process.env.POSTGRES_URL,
      has_database_url: !!process.env.DATABASE_URL
    });
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器內部錯誤：' + error.message }
    });
  }
}
