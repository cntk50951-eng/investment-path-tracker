import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db/client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 記錄用戶登錄
  if (req.method === 'POST') {
    try {
      const { user } = req.body;
      
      if (!user || !user.uid || !user.email) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATA', message: '用戶數據無效' }
        });
      }
      
      // 檢查用戶是否存在
      const existing = await query('SELECT id FROM users WHERE id = $1', [user.uid]);
      
      if (existing.rows.length > 0) {
        // 更新用戶
        await query('UPDATE users SET display_name = $1, photo_url = $2, last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [user.displayName || null, user.photoURL || null, user.uid]);
      } else {
        // 創建新用戶
        await query('INSERT INTO users (id, email, display_name, photo_url, premium_tier) VALUES ($1, $2, $3, $4, $5)', [user.uid, user.email, user.displayName || null, user.photoURL || null, 'free']);
      }
      
      // 記錄登錄日誌
      await query('INSERT INTO user_logins (user_id, ip_address, user_agent) VALUES ($1, $2, $3)', [user.uid, req.headers['x-forwarded-for'] || null, req.headers['user-agent'] || null]);
      
      return res.status(200).json({
        success: true,
        message: '用戶登錄記錄成功',
        source: 'PostgreSQL'
      });
      
    } catch (error) {
      console.error('API Error - POST /api/users:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '服務器內部錯誤' }
      });
    }
  }
  
  // 獲取用戶信息
  if (req.method === 'GET') {
    try {
      const userId = req.query.uid as string;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_PARAM', message: '缺少 uid 參數' }
        });
      }
      
      const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '用戶不存在' }
        });
      }
      
      return res.status(200).json({
        success: true,
        data: result.rows[0],
        source: 'PostgreSQL'
      });
      
    } catch (error) {
      console.error('API Error - GET /api/users:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '服務器內部錯誤' }
      });
    }
  }
  
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: '僅支持 GET/POST 請求' }
  });
}
