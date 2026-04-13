import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db/client.js';

const RATE_LIMIT = 100;
const RATE_WINDOW = 3600 * 1000;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    const market = (req.query.market as string) || 'US';
    
    const [nodesResult, switchesResult, macrosResult, alertsResult, newsResult] = await Promise.all([
      query('SELECT * FROM nodes WHERE market = $1', [market]),
      query('SELECT * FROM switches WHERE market = $1', [market]),
      query('SELECT * FROM macros'),
      query('SELECT * FROM alerts WHERE market = $1 LIMIT 1', [market]),
      query('SELECT * FROM news WHERE market = $1 ORDER BY date DESC LIMIT 20', [market]),
    ]);

    const marketData: any = {
      nodes: market === 'US' ? nodesResult.rows : {},
      switches: market === 'US' ? switchesResult.rows : {},
      macros: macrosResult.rows,
      alert: alertsResult.rows[0] || null,
      news: newsResult.rows,
    };

    if (market === 'HK') {
      marketData.message = '港股路徑數據即將上線，敬請期待';
    }

    return res.status(200).json({
      success: true,
      data: marketData,
      meta: { timestamp: new Date().toISOString(), version: '3.0.0', market, source: 'PostgreSQL' }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器內部錯誤' }
    });
  }
}
