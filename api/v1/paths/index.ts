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
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  rateLimitMap.set(ip, record);
  return true;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // 只允許 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: '僅支持 GET 請求'
      }
    });
  }
  
  try {
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    
    if (!checkRateLimit(String(ip))) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '請求頻率過高，請稍後再試',
          retryAfter: 3600
        }
      });
    }

    const market = (req.query.market as string) || 'US';
    const dataPath = join(process.cwd(), 'public', 'data', 'latest.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

    if (market === 'HK') {
      return res.status(200).json({
        success: true,
        data: {
          nodes: {},
          message: '港股路徑數據即將上線，敬請期待'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '3.0.0',
          market: 'HK'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        nodes: data.nodes,
        switches: data.switches,
        alert: data.alert,
        thresholdAlert: data.thresholdAlert
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: data.meta.version,
        market: 'US',
        lastUpdated: data.meta.lastUpdated
      }
    });

  } catch (error) {
    console.error('API Error - /paths:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤'
      }
    });
  }
}
