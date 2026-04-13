import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: '請求頻率過高，請稍後再試',
            retryAfter: 3600
          }
        },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market') || 'US';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const severity = searchParams.get('severity');
    const tag = searchParams.get('tag');

    const dataPath = join(process.cwd(), 'public', 'data', 'latest.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

    let news = data.news || [];

    // 按市場過濾
    if (market === 'HK') {
      news = news.filter((n: any) => n.market === 'HK' || !n.market);
    } else {
      news = news.filter((n: any) => n.market === 'US' || !n.market);
    }

    // 按嚴重性過濾
    if (severity) {
      news = news.filter((n: any) => n.severity === severity);
    }

    // 按標籤過濾
    if (tag) {
      news = news.filter((n: any) => n.tags?.includes(tag));
    }

    // 按路徑過濾
    const path = searchParams.get('path');
    if (path) {
      news = news.filter((n: any) => n.relatedPaths?.includes(path));
    }

    // 按日期範圍過濾
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      news = news.filter((n: any) => {
        if (startDate && n.date < startDate) return false;
        if (endDate && n.date > endDate) return false;
        return true;
      });
    }

    // 排序（最新優先）
    news = news.sort((a: any, b: any) => b.date.localeCompare(a.date));

    // 限制數量
    if (limit) {
      news = news.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        news,
        total: news.length
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        market,
        filters: { severity, tag, path, startDate, endDate, limit }
      }
    });

  } catch (error) {
    console.error('API Error - /news:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '服務器內部錯誤'
        }
      },
      { status: 500 }
    );
  }
}
