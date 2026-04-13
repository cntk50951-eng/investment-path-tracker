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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const { user } = req.body;
      
      if (!user || !user.uid || !user.email) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATA', message: '用戶數據無效' }
        });
      }
      
      const existing = await query('SELECT id FROM users WHERE id = $1', [user.uid]);
      
      if (existing.rows.length > 0) {
        await query('UPDATE users SET display_name = $1, photo_url = $2, last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [user.displayName || null, user.photoURL || null, user.uid]);
      } else {
        await query('INSERT INTO users (id, email, display_name, photo_url, premium_tier) VALUES ($1, $2, $3, $4, $5)', [user.uid, user.email, user.displayName || null, user.photoURL || null, 'free']);
      }
      
      await query('INSERT INTO user_logins (user_id, ip_address, user_agent) VALUES ($1, $2, $3)', [user.uid, req.headers['x-forwarded-for'] || null, req.headers['user-agent'] || null]);
      
      return res.status(200).json({
        success: true,
        message: '用戶登錄記錄成功',
        source: 'PostgreSQL'
      });
      
    } catch (error) {
      console.error('API Error - POST /api/users:', {
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
  
  if (req.method === 'GET') {
    try {
      const userId = req.query.uid;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAM', message: '缺少 uid 參數' }
        });
      }
      
      const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '用戶不存在' }
        });
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
        source: 'PostgreSQL'
      });
      
    } catch (error) {
      console.error('API Error - GET /api/users:', {
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
  
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: '僅支持 GET/POST 請求' }
  });
}
