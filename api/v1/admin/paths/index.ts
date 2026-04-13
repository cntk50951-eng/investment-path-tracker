import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db/client.js';

const API_KEY = process.env.API_KEY;

function verifyApiKey(req: VercelRequest): boolean {
  const apiKey = req.headers['x-api-key'];
  return apiKey === API_KEY;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // 更新 nodes
    if (body.data.nodes) {
      for (const [id, node] of Object.entries(body.data.nodes)) {
        const nodeData: any = node;
        await query(`
          UPDATE nodes 
          SET prob = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [nodeData.prob, id]);
        
        // 更新 alloc 如果有提供
        if (nodeData.alloc) {
          await query('DELETE FROM allocations WHERE node_id = $1', [id]);
          for (const alloc of nodeData.alloc) {
            await query('INSERT INTO allocations (node_id, name, tier) VALUES ($1, $2, $3)', [id, alloc.n, alloc.tier]);
          }
        }
      }
    }

    // 更新 switches
    if (body.data.switches) {
      for (const [id, sw] of Object.entries(body.data.switches)) {
        const swData: any = sw;
        await query(`
          UPDATE switches
          SET description = $1, next_check = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [swData.desc, swData.nextCheck, id]);
      }
    }

    // 更新 alert
    if (body.data.alert) {
      await query(`
        UPDATE alerts
        SET active = $1, level = $2, message = $3, action = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM alerts LIMIT 1)
      `, [body.data.alert.active, body.data.alert.level, body.data.alert.message, body.data.alert.action]);
    }

    // 更新 thresholdAlert
    if (body.data.thresholdAlert) {
      await query(`
        UPDATE threshold_alerts
        SET progress = $1, tier = $2, next_trigger = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM threshold_alerts LIMIT 1)
      `, [body.data.thresholdAlert.progress, body.data.thresholdAlert.tier, body.data.thresholdAlert.nextTrigger]);
    }

    const now = new Date().toISOString();
    
    return res.status(200).json({
      success: true,
      message: '路徑數據更新成功（實時寫入數據庫）',
      data: {
        lastUpdated: now,
        version: body.data.version || '3.0.0',
        source: 'PostgreSQL'
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
