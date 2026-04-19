import pkg from 'pg';
const { Pool } = pkg;

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('缺少數據庫連接字符串');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// MiniMax API 調用
async function callMiniMax(messages, apiKey, apiBase, model) {
  const response = await fetch(apiBase, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'MiniMax-M2',
      messages,
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`MiniMax API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || data.output?.text || '';
}

// 兩階段提示詞策略：
// 1. 先用關鍵字檢索相關新聞（而非把所有新聞塞進 prompt）
// 2. 系統提示詞不暴露內部設定，只以角色身份自然回答

const SYSTEM_PROMPT = `你是「新聞獵豹」財經新聞分析助手，專門分析系統收集的全球財經新聞。

回答規則：
- 用繁體中文回答，使用 Markdown 格式（標題、粗體、列表等）
- 只回答和新聞數據相關的問題
- 引用具體的新聞標題和來源
- 如果有多條相關新聞，按重要性或時間排序
- 如果系統中沒有相關新聞，如實告知
- 客觀描述新聞事實，不提供投資建議或預測市場走勢

如果用戶問的問題和新聞無關，自然地引導回新聞話題，比如：「我主要負責分析財經新聞，關於這個問題可能無法提供幫助。不過，如果你想了解相關的市場動態，我很樂意幫你查看。」`;

// 關鍵字提取：從用戶問題中提取搜尋關鍵字
function extractKeywords(question) {
  const stopWords = new Set([
    '的', '了', '是', '在', '有', '和', '與', '也', '都', '就', '不', '而', '你', '我',
    '他', '她', '它', '們', '這', '那', '什', '嗎', '呢', '吧', '啊', '呀', '嗯',
    '可以', '能', '會', '要', '想', '請', '告訴', '幫', '查看', '分析', '查詢',
    '有沒有', '哪些', '最近', '最新', '本週', '本日', '今天', '昨天', '什麼',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of',
    'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about',
  ]);

  const words = question
    .replace(/[，。！？、；：""''（）【】《》\[\]{}.,!?;:'"()]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.has(w.toLowerCase()));
  
  return words.slice(0, 10);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '僅支持 POST 請求' }
    });
  }

  try {
    const { question, market } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_QUESTION', message: '請提供有效的問題' }
      });
    }

    if (question.length > 500) {
      return res.status(400).json({
        success: false,
        error: { code: 'QUESTION_TOO_LONG', message: '問題長度不能超過 500 字' }
      });
    }

    const marketFilter = market || 'US';

    // 1. 兩階段檢索：先關鍵字匹配，再按日期補充
    let newsData = [];
    try {
      const keywords = extractKeywords(question);
      
      // 階段 1：關鍵字匹配（標題、摘要、標籤）
      let keywordQuery = `
        SELECT n.id, n.title, n.source, n.severity, n.summary, n.impact, n.date, 
               n.published_time, n.url,
               COALESCE(
                 json_agg(DISTINCT jsonb_build_object('tag', nt.tag)) 
                 FILTER (WHERE nt.tag IS NOT NULL), 
                 '[]'::json
               ) as tags,
               COALESCE(
                 json_agg(DISTINCT jsonb_build_object('path_id', nrp.path_id)) 
                 FILTER (WHERE nrp.path_id IS NOT NULL), 
                 '[]'::json
               ) as related_paths,
               COALESCE(
                 json_agg(DISTINCT jsonb_build_object('switch_id', na.switch_id)) 
                 FILTER (WHERE na.switch_id IS NOT NULL), 
                 '[]'::json
               ) as affects
        FROM news n
        LEFT JOIN news_tags nt ON n.id = nt.news_id
        LEFT JOIN news_related_paths nrp ON n.id = nrp.news_id
        LEFT JOIN news_affects na ON n.id = na.news_id
        WHERE (n.market = $1 OR n.market IS NULL)
      `;

      const params = [marketFilter];
      
      if (keywords.length > 0) {
        // 構建 ILIKE 條件：在標題、摘要中搜尋關鍵字
        const likeConditions = keywords.map((kw, i) => {
          params.push(`%${kw}%`);
          return `(n.title ILIKE $${params.length} OR n.summary ILIKE $${params.length})`;
        });
        keywordQuery += ` AND (${likeConditions.join(' OR ')})`;
      }

      keywordQuery += `
        GROUP BY n.id
        ORDER BY n.date DESC, n.published_time DESC
        LIMIT 30
      `;

      const keywordResult = await query(keywordQuery, params);
      newsData = keywordResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        source: row.source,
        severity: row.severity,
        summary: row.summary,
        impact: row.impact,
        date: row.date,
        publishedTime: row.published_time,
        url: row.url,
        tags: row.tags?.map(t => t.tag) || [],
        relatedPaths: row.related_paths?.map(p => p.path_id) || [],
        affects: row.affects?.map(a => a.switch_id) || [],
      }));

      // 階段 2：如果關鍵字匹配不足 15 條，補充最新新聞
      if (newsData.length < 15) {
        const existingIds = newsData.map(n => `'${n.id}'`).join(',');
        const supplementQuery = `
          SELECT n.id, n.title, n.source, n.severity, n.summary, n.impact, n.date, 
                 n.published_time, n.url,
                 COALESCE(
                   json_agg(DISTINCT jsonb_build_object('tag', nt.tag)) 
                   FILTER (WHERE nt.tag IS NOT NULL), 
                   '[]'::json
                 ) as tags,
                 COALESCE(
                   json_agg(DISTINCT jsonb_build_object('path_id', nrp.path_id)) 
                   FILTER (WHERE nrp.path_id IS NOT NULL), 
                   '[]'::json
                 ) as related_paths,
                 COALESCE(
                   json_agg(DISTINCT jsonb_build_object('switch_id', na.switch_id)) 
                   FILTER (WHERE na.switch_id IS NOT NULL), 
                   '[]'::json
                 ) as affects
          FROM news n
          LEFT JOIN news_tags nt ON n.id = nt.news_id
          LEFT JOIN news_related_paths nrp ON n.id = nrp.news_id
          LEFT JOIN news_affects na ON n.id = na.news_id
          WHERE (n.market = $1 OR n.market IS NULL)
          ${existingIds ? `AND n.id NOT IN (${existingIds})` : ''}
          GROUP BY n.id
          ORDER BY n.date DESC, n.published_time DESC
          LIMIT $2
        `;
        const supplementResult = await query(supplementQuery, [marketFilter, 30 - newsData.length]);
        const supplementData = supplementResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          source: row.source,
          severity: row.severity,
          summary: row.summary,
          impact: row.impact,
          date: row.date,
          publishedTime: row.published_time,
          url: row.url,
          tags: row.tags?.map(t => t.tag) || [],
          relatedPaths: row.related_paths?.map(p => p.path_id) || [],
          affects: row.affects?.map(a => a.switch_id) || [],
        }));
        newsData = [...newsData, ...supplementData];
      }

    } catch (dbError) {
      console.error('獲取新聞數據失敗:', dbError.message);
      newsData = [];
    }

    // 2. 構建精簡新聞上下文（控制 token 數量）
    let newsContext;
    if (newsData.length > 0) {
      newsContext = newsData.map((n, i) => {
        let ctx = `[${i + 1}] ${n.date?.toISOString?.()?.split('T')?.[0] || n.date} | **${n.title}** (${n.source})`;
        if (n.severity) ctx += ` [${n.severity}]`;
        if (n.summary) {
          const short = n.summary.length > 150 ? n.summary.substring(0, 150) + '...' : n.summary;
          ctx += `\n摘要: ${short}`;
        }
        if (n.impact) {
          const short = n.impact.length > 100 ? n.impact.substring(0, 100) + '...' : n.impact;
          ctx += `\n影響: ${short}`;
        }
        if (n.tags?.length) ctx += `\n標籤: ${n.tags.slice(0, 5).join(', ')}`;
        if (n.relatedPaths?.length) ctx += `\n路徑: ${n.relatedPaths.join(', ')}`;
        return ctx;
      }).join('\n\n');
    } else {
      newsContext = '目前系統中沒有相關新聞數據。';
    }

    // 3. 構建消息
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `以下是系統中收集的 ${newsData.length} 條相關新聞：\n\n${newsContext}` },
      { role: 'user', content: question },
    ];

    // 4. 檢查緩存
    let cachedAnswer = null;
    try {
      const cacheResult = await query(
        `SELECT answer FROM news_ai_cache 
         WHERE question = $1 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
         LIMIT 1`,
        [question.trim()]
      );
      if (cacheResult.rows.length > 0) {
        cachedAnswer = cacheResult.rows[0].answer;
        await query(
          'UPDATE news_ai_cache SET hit_count = hit_count + 1 WHERE question = $1',
          [question.trim()]
        );
      }
    } catch (e) {
      // 緩存表可能不存在，忽略
    }

    if (cachedAnswer) {
      return res.status(200).json({
        success: true,
        answer: cachedAnswer,
        cached: true,
        newsCount: newsData.length,
        source: 'cache',
      });
    }

    // 5. 調用 MiniMax API
    const apiKey = process.env.MINIMAX_API_KEY;
    const apiBase = process.env.MINIMAX_API_BASE || 'https://api.minimaxi.com/v1/text/chatcompletion_v2';
    const model = process.env.MINIMAX_MODEL || 'MiniMax-M2';

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: { code: 'NO_API_KEY', message: 'AI 服務暫時不可用，請稍後再試' }
      });
    }

    const answer = await callMiniMax(messages, apiKey, apiBase, model);

    // 6. 存入緩存（24 小時過期）
    try {
      await query(
        `INSERT INTO news_ai_cache (question, answer, news_snapshot_hash, expires_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '24 hours')
         ON CONFLICT (question) DO UPDATE SET answer = $2, hit_count = 1, expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours'`,
        [question.trim(), answer, `news_${marketFilter}_${newsData.length}`]
      );
    } catch (e) {
      console.error('緩存寫入失敗:', e.message);
    }

    return res.status(200).json({
      success: true,
      answer,
      cached: false,
      newsCount: newsData.length,
      source: 'minimax',
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
}