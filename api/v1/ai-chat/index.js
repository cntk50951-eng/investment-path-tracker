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

// 系統提示詞：只回答新聞相關問題
const SYSTEM_PROMPT = `你是「新聞獵豹 AI 助手」，專門根據系統收集的全球財經新聞數據回答用戶問題。

你的知識範圍僅限於系統中已收集的新聞數據，你必須嚴格遵守以下規則：

1. **只回答新聞相關問題**：用戶的問題必須與已收集的新聞內容相關。你可以：
   - 查詢特定新聞事件的詳情
   - 總結某個主題的相關新聞
   - 分析新聞對投資路徑的影響
   - 比較不同新聞事件的關聯性
   - 按時間、嚴重性、來源等維度篩選新聞

2. **必須拒絕的問題類型**：
   - 與新聞數據無關的問題（如編程、食譜、歷史常識等）
   - 要求提供投資建議或股票推薦（你只能客觀描述新聞內容）
   - 超出系統新聞時間範圍的問題
   - 任何與財經新聞無關的對話

3. **回答格式**：
   - 用繁體中文回答
   - 引用具體的新聞標題和來源
   - 如果有多條相關新聞，按時間排序呈現
   - 如果無法在新聞數據中找到相關內容，明確告訴用戶「系統中暫無相關新聞」

4. **合規注意**：
   - 不提供投資建議
   - 不預測市場走勢
   - 只客觀描述新聞事實
`;

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

    // 1. 從數據庫獲取新聞數據
    let newsData = [];
    try {
      const newsResult = await query(`
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
        WHERE n.market = $1 OR n.market IS NULL
        GROUP BY n.id
        ORDER BY n.date DESC
        LIMIT 100
      `, [marketFilter]);

      newsData = newsResult.rows.map(row => ({
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
    } catch (dbError) {
      console.error('獲取新聞數據失敗:', dbError.message);
      newsData = [];
    }

    // 2. 構建新聞上下文
    const newsContext = newsData.length > 0
      ? newsData.map((n, i) => {
          let ctx = `[${i + 1}] ${n.date} | ${n.title} (${n.source}, 嚴重性: ${n.severity})`;
          if (n.summary) ctx += `\n    摘要: ${n.summary.substring(0, 200)}`;
          if (n.impact) ctx += `\n    影響: ${n.impact.substring(0, 200)}`;
          if (n.tags?.length) ctx += `\n    標籤: ${n.tags.join(', ')}`;
          if (n.relatedPaths?.length) ctx += `\n    關聯路徑: ${n.relatedPaths.join(', ')}`;
          if (n.affects?.length) ctx += `\n    影響切換: ${n.affects.join(', ')}`;
          return ctx;
        }).join('\n\n')
      : '目前系統中沒有新聞數據。';

    // 3. 構建消息
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + '\n\n以下是系統中目前收集的新聞數據：\n\n' + newsContext },
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
        // 更新命中次數
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
        error: { code: 'NO_API_KEY', message: 'MiniMax API Key 未配置' }
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
      // 緩存寫入失敗不影響回答
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