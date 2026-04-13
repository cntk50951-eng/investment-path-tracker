import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// 速率限制簡單實現（生產環境建議使用 Upstash Redis）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 100; // 每小時 100 請求
const RATE_WINDOW = 3600 * 1000; // 1 小時

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
    // 獲取 IP 進行速率限制
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // 檢查速率限制
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

    // 獲取市場參數
    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market') || 'US';

    // 讀取數據文件
    const dataPath = join(process.cwd(), 'public', 'data', 'latest.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

    // 過濾市場數據（目前只有美股，港股數據待添加）
    if (market === 'HK') {
      // 港股數據尚未上線
      return NextResponse.json({
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

    // 返回美股數據
    return NextResponse.json({
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
