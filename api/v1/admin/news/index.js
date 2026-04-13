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

const API_KEY = process.env.API_KEY;

function verifyApiKey(req) {
  const apiKey = req.headers['x-api-key'];
  return apiKey === API_KEY;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '僅支持 POST 請求' }
    });
  }
  
  if (!verifyApiKey(req)) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'API Key 無效或缺失' }
    });
  }

  try {
    const body = req.body;
    
    if (!body.news || !Array.isArray(body.news)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATA', message: '新聞數據必須是數組格式' }
      });
    }

    const now = new Date().toISOString();

    for (const newsItem of body.news) {
      const existing = await query('SELECT id FROM news WHERE id = $1', [newsItem.id]);
      
      if (existing.rows.length > 0) {
        await query(`
          UPDATE news
          SET market = $1, date = $2, title = $3, source = $4, severity = $5, 
              summary = $6, impact = $7, url = $8, updated_at = CURRENT_TIMESTAMP
          WHERE id = $9
        `, [
          newsItem.market || 'US', newsItem.date, newsItem.title, newsItem.source,
          newsItem.severity, newsItem.summary, newsItem.impact, newsItem.url, newsItem.id
        ]);
        
        await query('DELETE FROM news_affects WHERE news_id = $1', [newsItem.id]);
        await query('DELETE FROM news_related_paths WHERE news_id = $1', [newsItem.id]);
        await query('DELETE FROM news_tags WHERE news_id = $1', [newsItem.id]);
      } else {
        await query(`
          INSERT INTO news (id, market, date, title, source, severity, summary, impact, url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          newsItem.id, newsItem.market || 'US', newsItem.date, newsItem.title,
          newsItem.source, newsItem.severity, newsItem.summary, newsItem.impact, newsItem.url
        ]);
      }
      
      if (newsItem.affects) {
        for (const switchId of newsItem.affects) {
          await query('INSERT INTO news_affects (news_id, switch_id) VALUES ($1, $2)', [newsItem.id, switchId]);
        }
      }
      
      if (newsItem.relatedPaths) {
        for (const pathId of newsItem.relatedPaths) {
          await query('INSERT INTO news_related_paths (news_id, path_id) VALUES ($1, $2)', [newsItem.id, pathId]);
        }
      }
      
      if (newsItem.tags) {
        for (const tag of newsItem.tags) {
          await query('INSERT INTO news_tags (news_id, tag) VALUES ($1, $2)', [newsItem.id, tag]);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: '新聞數據更新成功（實時寫入數據庫）',
      data: {
        count: body.news.length,
        lastUpdated: now,
        source: 'PostgreSQL'
      }
    });

  } catch (error) {
    console.error('API Error - POST /admin/news:', {
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
