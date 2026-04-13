import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const API_KEY = process.env.API_KEY;

function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key');
  return apiKey === API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyApiKey(request)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'API Key 無效或缺失'
          }
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if (!body.news || !Array.isArray(body.news)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: '新聞數據必須是數組格式'
          }
        },
        { status: 400 }
      );
    }

    const dataPath = join(process.cwd(), 'public', 'data', 'latest.json');
    const currentData = JSON.parse(readFileSync(dataPath, 'utf-8'));

    currentData.news = body.news;
    currentData.meta.lastUpdated = new Date().toISOString();

    writeFileSync(dataPath, JSON.stringify(currentData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: '新聞數據更新成功',
      data: {
        count: body.news.length,
        lastUpdated: currentData.meta.lastUpdated
      }
    });

  } catch (error) {
    console.error('API Error - POST /admin/news:', error);
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
