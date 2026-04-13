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
        error: { code: 'RATE_LIMIT_EXCEEDED', message: '請求頻率過高' }
      });
    }

    const market = (req.query.market as string) || 'US';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const severity = req.query.severity as string;
    const tag = req.query.tag as string;
    const path = req.query.path as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // 構建 WHERE 條件
    const conditions = ['market = $1'];
    const params: any[] = [market];
    let paramIndex = 2;

    if (severity) {
      conditions.push(`severity = $${paramIndex++}`);
      params.push(severity);
    }

    if (startDate) {
      conditions.push(`date >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`date <= $${paramIndex++}`);
      params.push(endDate);
    }

    if (tag) {
      // 需要 JOIN news_tags 表
      const tagNewsResult = await query('SELECT DISTINCT news_id FROM news_tags WHERE tag = $1', [tag]);
      const tagNewsIds = tagNewsResult.rows.map((r: any) => r.news_id);
      if (tagNewsIds.length > 0) {
        conditions.push(`id = ANY($${paramIndex++})`);
        params.push(tagNewsIds);
      } else {
        // 沒有匹配的新聞
        return res.status(200).json({
          success: true,
          data: { news: [], total: 0 },
          meta: { timestamp: new Date().toISOString(), version: '3.0.0', market, filters: { severity, tag, path } }
        });
      }
    }

    if (path) {
      // 需要 JOIN news_related_paths 表
      const pathNewsResult = await query('SELECT DISTINCT news_id FROM news_related_paths WHERE path_id = $1', [path]);
      const pathNewsIds = pathNewsResult.rows.map((r: any) => r.news_id);
      if (pathNewsIds.length > 0) {
        conditions.push(`id = ANY($${paramIndex++})`);
        params.push(pathNewsIds);
      } else {
        return res.status(200).json({
          success: true,
          data: { news: [], total: 0 },
          meta: { timestamp: new Date().toISOString(), version: '3.0.0', market, filters: { severity, tag, path } }
        });
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 獲取新聞
    let newsQuery = `
      SELECT id, market, date, title, source, severity, summary, impact, url, created_at, updated_at
      FROM news
      ${whereClause}
      ORDER BY date DESC
    `;
    
    if (limit) {
      newsQuery += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    const newsResult = await query(newsQuery, params);

    // 為每條新聞獲取 affects, relatedPaths, tags
    const news = await Promise.all(newsResult.rows.map(async (newsItem: any) => {
      const [affectsResult, pathsResult, tagsResult] = await Promise.all([
        query('SELECT switch_id FROM news_affects WHERE news_id = $1', [newsItem.id]),
        query('SELECT path_id FROM news_related_paths WHERE news_id = $1', [newsItem.id]),
        query('SELECT tag FROM news_tags WHERE news_id = $1', [newsItem.id]),
      ]);

      return {
        id: newsItem.id,
        market: newsItem.market,
        date: newsItem.date.toISOString().split('T')[0],
        title: newsItem.title,
        source: newsItem.source,
        severity: newsItem.severity,
        summary: newsItem.summary,
        impact: newsItem.impact,
        url: newsItem.url,
        affects: affectsResult.rows.map((r: any) => r.switch_id),
        relatedPaths: pathsResult.rows.map((r: any) => r.path_id),
        tags: tagsResult.rows.map((r: any) => r.tag)
      };
    }));

    return res.status(200).json({
      success: true,
      data: { news, total: news.length },
      meta: {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        market,
        filters: { severity, tag, path, startDate, endDate, limit },
        source: 'PostgreSQL'
      }
    });

  } catch (error) {
    console.error('API Error - /news:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服務器內部錯誤' }
    });
  }
}
