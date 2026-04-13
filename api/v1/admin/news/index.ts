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
    
    if (!body.news || !Array.isArray(body.news)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATA', message: '新聞數據必須是數組格式' }
      });
    }

    const now = new Date().toISOString();

    // 逐條處理新聞
    for (const newsItem of body.news) {
      // 檢查是否已存在
      const existing = await query('SELECT id FROM news WHERE id = $1', [newsItem.id]);
      
      if (existing.rows.length > 0) {
        // 更新
        await query(`
          UPDATE news
          SET market = $1, date = $2, title = $3, source = $4, severity = $5, 
              summary = $6, impact = $7, url = $8, updated_at = CURRENT_TIMESTAMP
          WHERE id = $9
        `, [
          newsItem.market || 'US', newsItem.date, newsItem.title, newsItem.source,
          newsItem.severity, newsItem.summary, newsItem.impact, newsItem.url, newsItem.id
        ]);
        
        // 刪除舊的關聯
        await query('DELETE FROM news_affects WHERE news_id = $1', [newsItem.id]);
        await query('DELETE FROM news_related_paths WHERE news_id = $1', [newsItem.id]);
        await query('DELETE FROM news_tags WHERE news_id = $1', [newsItem.id]);
      } else {
        // 插入
        await query(`
          INSERT INTO news (id, market, date, title, source, severity, summary, impact, url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          newsItem.id, newsItem.market || 'US', newsItem.date, newsItem.title,
          newsItem.source, newsItem.severity, newsItem.summary, newsItem.impact, newsItem.url
        ]);
      }
      
      // 插入 affects
      if (newsItem.affects) {
        for (const switchId of newsItem.affects) {
          await query('INSERT INTO news_affects (news_id, switch_id) VALUES ($1, $2)', [newsItem.id, switchId]);
        }
      }
      
      // 插入 relatedPaths
      if (newsItem.relatedPaths) {
        for (const pathId of newsItem.relatedPaths) {
          await query('INSERT INTO news_related_paths (news_id, path_id) VALUES ($1, $2)', [newsItem.id, pathId]);
        }
      }
      
      // 插入 tags
      if (newsItem.tags) {
        for (const tag of newsItem.tags) {
          await query('INSERT INTO news_tags (news_id, tag) VALUES ($1, $2)', [newsItem.id, tag]);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: '新聞數據更新成功（實時寫入數據庫）',
      data: {
        count: body.news.length,
        lastUpdated: now,
        source: 'PostgreSQL'
      }
    });

  } catch (error) {
    console.error('API Error - POST /admin/news:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器內部錯誤' }
    });
  }
}
