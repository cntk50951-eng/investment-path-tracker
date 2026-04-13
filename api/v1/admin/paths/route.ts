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
    
    if (!body.data || typeof body.data !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: '數據格式無效'
          }
        },
        { status: 400 }
      );
    }

    const dataPath = join(process.cwd(), 'public', 'data', 'latest.json');
    const currentData = JSON.parse(readFileSync(dataPath, 'utf-8'));

    const updatedData = {
      ...currentData,
      nodes: body.data.nodes || currentData.nodes,
      switches: body.data.switches || currentData.switches,
      alert: body.data.alert ?? currentData.alert,
      thresholdAlert: body.data.thresholdAlert ?? currentData.thresholdAlert,
      meta: {
        ...currentData.meta,
        lastUpdated: new Date().toISOString(),
        version: body.data.version || currentData.meta.version
      }
    };

    writeFileSync(dataPath, JSON.stringify(updatedData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: '路徑數據更新成功',
      data: {
        lastUpdated: updatedData.meta.lastUpdated,
        version: updatedData.meta.version
      }
    });

  } catch (error) {
    console.error('API Error - POST /admin/paths:', error);
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
