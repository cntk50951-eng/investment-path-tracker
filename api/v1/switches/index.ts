import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

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

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '僅支持 GET 請求' } });
  }
  
  try {
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    if (!checkRateLimit(String(ip))) {
      return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: '請求頻率過高' } });
    }

    const market = (req.query.market as string) || 'US';
    const dataPath = join(process.cwd(), 'public', 'data', 'latest.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

    const switches = market === 'HK' ? {} : data.switches || {};

    return res.status(200).json({
      success: true,
      data: { switches },
      meta: { timestamp: new Date().toISOString(), version: '3.0.0', market, count: Object.keys(switches).length }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服務器內部錯誤' } });
  }
}
