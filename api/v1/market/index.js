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

    const market = req.query.market || 'US';
    
    const [nodesResult, switchesResult, macrosResult, alertsResult, newsResult] = await Promise.all([
      query('SELECT * FROM nodes WHERE market = $1 ORDER BY prob DESC', [market]),
      query('SELECT * FROM switches WHERE market = $1', [market]),
      query('SELECT name, value, trend, status, note FROM macros WHERE market = $1 ORDER BY id', [market]),
      query('SELECT * FROM alerts WHERE market = $1 LIMIT 1', [market]),
      query('SELECT * FROM news WHERE market = $1 ORDER BY date DESC LIMIT 20', [market]),
    ]);

    const nodes = {};
    for (const node of nodesResult.rows) {
      const allocsResult = await query('SELECT name, tier FROM allocations WHERE node_id = $1', [node.id]);
      nodes[node.id] = {
        id: node.id,
        name: node.name,
        sub: node.sub,
        color: node.color,
        x: node.x,
        y: node.y,
        prob: node.prob,
        current: node.current,
        alloc: allocsResult.rows.map(a => ({ n: a.name, tier: a.tier }))
      };
    }

    const switches = {};
    for (const sw of switchesResult.rows) {
      const confirmsResult = await query('SELECT text, status, actual, note FROM confirm_signals WHERE switch_id = $1', [sw.id]);
      switches[sw.id] = {
        from: sw.from_node,
        to: sw.to_node,
        time: sw.time,
        trigger: sw.trigger,
        path: sw.path,
        confirms: confirmsResult.rows.map(c => ({ text: c.text, status: c.status, actual: c.actual, note: c.note })),
        desc: sw.description,
        nextCheck: sw.next_check
      };
    }

    const marketData = {
      nodes,
      switches,
      macros: macrosResult.rows,
      alert: alertsResult.rows[0] ? {
        active: alertsResult.rows[0].active,
        level: alertsResult.rows[0].level,
        timestamp: alertsResult.rows[0].timestamp,
        title: alertsResult.rows[0].title,
        message: alertsResult.rows[0].message,
        action: alertsResult.rows[0].action
      } : null,
      news: newsResult.rows,
    };

    return res.status(200).json({
      success: true,
      data: marketData,
      meta: { timestamp: new Date().toISOString(), version: '3.0.0', market, source: 'PostgreSQL' }
    });

  } catch (error) {
    console.error('API Error - /market:', {
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
