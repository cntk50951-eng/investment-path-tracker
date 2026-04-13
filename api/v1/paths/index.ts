import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db/client.js';

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
  
  if (record.count >= RATE_LIMIT) return false;
  
  record.count++;
  rateLimitMap.set(ip, record);
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '僅支持 GET 請求' }
    });
  }
  
  try {
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    
    if (!checkRateLimit(String(ip))) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: '請求頻率過高，請稍後再試' }
      });
    }

    const market = (req.query.market as string) || 'US';

    // 從數據庫讀取
    const [nodesResult, switchesResult, alertsResult, thresholdResult, macrosResult] = await Promise.all([
      query('SELECT * FROM nodes WHERE market = $1 ORDER BY prob DESC', [market]),
      query('SELECT * FROM switches WHERE market = $1', [market]),
      query('SELECT * FROM alerts WHERE market = $1 LIMIT 1', [market]),
      query('SELECT * FROM threshold_alerts WHERE market = $1 LIMIT 1', [market]),
      query('SELECT * FROM macros ORDER BY id'),
    ]);

    // 構建 nodes 對象
    const nodes: Record<string, any> = {};
    for (const node of nodesResult.rows) {
      // 獲取板塊分配
      const allocsResult = await query('SELECT name, tier FROM allocations WHERE node_id = $1', [node.id]);
      nodes[node.id] = {
        id: node.id,
        name: node.name,
        sub: node.sub,
        color: node.color,
        x: node.x,
        y: node.y,
        prob: node.prob,
        current: node.current,
        alloc: allocsResult.rows.map((a: any) => ({ n: a.name, tier: a.tier }))
      };
    }

    // 構建 switches 對象
    const switches: Record<string, any> = {};
    for (const sw of switchesResult.rows) {
      // 獲取確認信號
      const confirmsResult = await query('SELECT text, status, actual, note FROM confirm_signals WHERE switch_id = $1', [sw.id]);
      switches[sw.id] = {
        from: sw.from_node,
        to: sw.to_node,
        time: sw.time,
        trigger: sw.trigger,
        path: sw.path,
        confirms: confirmsResult.rows.map((c: any) => ({
          text: c.text,
          status: c.status,
          actual: c.actual,
          note: c.note
        })),
        desc: sw.description,
        nextCheck: sw.next_check
      };
    }

    const alert = alertsResult.rows[0] || null;
    const thresholdAlert = thresholdResult.rows[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        nodes,
        switches,
        alert: alert ? {
          active: alert.active,
          level: alert.level,
          timestamp: alert.timestamp,
          title: alert.title,
          message: alert.message,
          action: alert.action
        } : null,
        thresholdAlert: thresholdAlert ? {
          switchId: thresholdAlert.switch_id,
          progress: parseFloat(thresholdAlert.progress),
          tier: thresholdAlert.tier,
          nextTrigger: thresholdAlert.next_trigger
        } : null,
        macros: macrosResult.rows.map((m: any) => ({
          name: m.name,
          value: m.value,
          trend: m.trend,
          status: m.status,
          note: m.note
        }))
      },
      meta: {
        timestamp: new Date().toISOString(),
        market,
        source: 'PostgreSQL'
      }
    });

  } catch (error) {
    console.error('API Error - /paths:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器內部錯誤' }
    });
  }
}
