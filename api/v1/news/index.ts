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
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    
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
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const severity = req.query.severity as string;
    const tag = req.query.tag as string;
    const path = req.query.path as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const dataPath = join(process.cwd(), 'public', 'data', 'latest.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

    let news = data.news || [];

    if (market === 'HK') {
      news = news.filter((n: any) => n.market === 'HK' || !n.market);
    } else {
      news = news.filter((n: any) => n.market === 'US' || !n.market);
    }

    if (severity) {
      news = news.filter((n: any) => n.severity === severity);
    }

    if (tag) {
      news = news.filter((n: any) => n.tags?.includes(tag));
    }

    if (path) {
      news = news.filter((n: any) => n.relatedPaths?.includes(path));
    }

    if (startDate || endDate) {
      news = news.filter((n: any) => {
        if (startDate && n.date < startDate) return false;
        if (endDate && n.date > endDate) return false;
        return true;
      });
    }

    news = news.sort((a: any, b: any) => b.date.localeCompare(a.date));

    if (limit) {
      news = news.slice(0, limit);
    }

    return res.status(200).json({
      success: true,
      data: {
        news,
        total: news.length
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        market,
        filters: { severity, tag, path, startDate, endDate, limit }
      }
    });

  } catch (error) {
    console.error('API Error - /news:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤'
      }
    });
  }
}
