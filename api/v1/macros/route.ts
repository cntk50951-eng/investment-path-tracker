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

    const dataPath = join(process.cwd(), 'public', 'data', 'latest.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

    return NextResponse.json({
      success: true,
      data: {
        macros: data.macros || []
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        count: data.macros?.length || 0
      }
    });

  } catch (error) {
    console.error('API Error - /macros:', error);
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
