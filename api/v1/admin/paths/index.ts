import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const API_KEY = process.env.API_KEY;

function verifyApiKey(req: VercelRequest): boolean {
  const apiKey = req.headers['x-api-key'];
  return apiKey === API_KEY;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '僅支持 POST 請求' }
    });
  }
  
  if (!verifyApiKey(req)) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'API Key 無效或缺失' }
    });
  }

  try {
    const body = req.body;
    
    if (!body.data || typeof body.data !== 'object') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATA', message: '數據格式無效' }
      });
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

    return res.status(200).json({
      success: true,
      message: '路徑數據更新成功',
      data: {
        lastUpdated: updatedData.meta.lastUpdated,
        version: updatedData.meta.version
      }
    });

  } catch (error) {
    console.error('API Error - POST /admin/paths:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器內部錯誤' }
    });
  }
}
