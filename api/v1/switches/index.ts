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
    const result = await query('SELECT * FROM switches WHERE market = $1', [market]);

    const switches: Record<string, any> = {};
    for (const sw of result.rows) {
      const confirmsResult = await query('SELECT text, status, actual, note FROM confirm_signals WHERE switch_id = $1', [sw.id]);
      switches[sw.id] = {
        from: sw.from_node,
        to: sw.to_node,
        time: sw.time,
        trigger: sw.trigger,
        path: sw.path,
        confirms: confirmsResult.rows.map((c: any) => ({ text: c.text, status: c.status, actual: c.actual, note: c.note })),
        desc: sw.description,
        nextCheck: sw.next_check
      };
    }

    return res.status(200).json({
      success: true,
      data: { switches },
      meta: { timestamp: new Date().toISOString(), version: '3.0.0', market, count: Object.keys(switches).length, source: 'PostgreSQL' }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器內部錯誤' }
    });
  }
}
