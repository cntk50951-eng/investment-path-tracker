#!/usr/bin/env node
/**
 * AI 新聞 QA 調試測試腳本
 * 測試問題拆解、多子查詢搜索、相關性排序效果
 * 
 * 用法:
 *   node scripts/test-ai-chat.js "美聯儲降息對科技股有什麼影響？"
 *   node scripts/test-ai-chat.js --search-only "關稅相關新聞"
 *   node scripts/test-ai-chat.js --intent-only "總結本週市場"
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE = process.env.MINIMAX_API_BASE || 'https://api.minimaxi.com/v1/text/chatcompletion_v2';
const API_KEY = process.env.MINIMAX_API_KEY;
const MODEL = process.env.MINIMAX_MODEL || 'MiniMax-M2';

// 模擬 AI 拆解 Prompt（簡化版，用於測試）
const TEST_DECOMPOSITIONS = {
  'default': {
    sub_queries: [
      { query_id: 1, description: '測試查詢', keywords: ['test'], time_range: { type: 'recent_days', days: 7 } }
    ],
    search_intent: 'event_query'
  }
};

async function callMiniMax(messages, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.max_tokens ?? 800,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.output?.text || '';
    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function testIntentDecomposition(question) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧠 測試 AI 問題拆解');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`問題: ${question}\n`);

  const prompt = `你是一個財經新聞搜索策略專家。將用戶問題拆解成多個獨立搜索子查詢。
輸出嚴格 JSON：
{"sub_queries":[{"query_id":1,"description":"描述","keywords":["關鍵詞"],"time_range":{"type":"recent_days","days":7}}],"search_intent":"event_query"}

範例：
「美聯儲降息對科技股和債券市場有什麼影響？」
→ {"sub_queries":[{"query_id":1,"description":"美聯儲降息動態","keywords":["Fed","降息","rate cut"],"time_range":{"type":"recent_days","days":14}},{"query_id":2,"description":"科技股反應","keywords":["科技股","tech stocks","NASDAQ"],"time_range":{"type":"recent_days","days":14}},{"query_id":3,"description":"債券市場反應","keywords":["債券","bonds","Treasury"],"time_range":{"type":"recent_days","days":14}}],"search_intent":"impact_analysis"}

絕對不要輸出解釋，只輸出 JSON。`;

  try {
    const start = Date.now();
    const response = await callMiniMax([
      { role: 'system', content: prompt },
      { role: 'user', content: question },
    ]);
    const elapsed = Date.now() - start;

    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`✅ 拆解成功 (${elapsed}ms)`);
      console.log(`意圖類型: ${parsed.search_intent || 'unknown'}`);
      console.log(`子查詢數: ${parsed.sub_queries?.length || 0}\n`);
      
      for (const sq of parsed.sub_queries || []) {
        console.log(`  [${sq.query_id}] ${sq.description}`);
        console.log(`      關鍵詞: ${sq.keywords?.join(', ')}`);
        console.log(`      時間: ${sq.time_range?.type}${sq.time_range?.days ? ` (${sq.time_range.days}天)` : ''}`);
        console.log('');
      }
      return parsed;
    } else {
      console.log('❌ 無法解析 JSON');
      console.log('原始輸出:', response);
    }
  } catch (e) {
    console.log(`❌ 拆解失敗: ${e.message}`);
  }
  return null;
}

async function testDBSearch(decomposition, market = 'US') {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 測試 DB 搜索');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  });

  async function dbQuery(text, params) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  const allKeywords = [...new Set(decomposition.sub_queries.flatMap(sq => sq.keywords))];
  console.log(`總關鍵詞: ${allKeywords.join(', ')}\n`);

  // 統計新聞總數
  const countResult = await dbQuery('SELECT COUNT(*) FROM news WHERE market = $1 OR market IS NULL', [market]);
  console.log(`📊 DB 中新聞總數: ${countResult.rows[0].count}`);

  for (const sq of decomposition.sub_queries) {
    console.log(`\n── 子查詢 ${sq.query_id}: ${sq.description} ──`);
    const kws = sq.keywords.filter(kw => kw.length >= 1);
    if (kws.length === 0) {
      console.log('  ⚠️ 無有效關鍵詞');
      continue;
    }

    const params = [market];
    const conds = kws.map((kw) => {
      params.push(`%${kw}%`);
      return `(title ILIKE $${params.length} OR summary ILIKE $${params.length})`;
    });

    const sql = `
      SELECT id, title, source, severity, date, summary,
             CASE WHEN severity = 'critical' THEN 0 WHEN severity = 'medium' THEN 1 ELSE 2 END AS severity_order
      FROM news
      WHERE (market = $1 OR market IS NULL)
        AND (${conds.join(' OR ')})
      ORDER BY severity_order, date DESC
      LIMIT 5
    `;

    const start = Date.now();
    const result = await dbQuery(sql, params);
    const elapsed = Date.now() - start;

    console.log(`  找到 ${result.rows.length} 條 (${elapsed}ms)`);
    for (const row of result.rows) {
      const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).substring(0, 10);
      console.log(`    [${row.severity}] ${dateStr} | ${row.title.substring(0, 60)}${row.title.length > 60 ? '...' : ''}`);
    }
  }

  await pool.end();
}

async function main() {
  const args = process.argv.slice(2);
  const question = args.find(a => !a.startsWith('--')) || '最近有什麼關稅相關的新聞？';
  const intentOnly = args.includes('--intent-only');
  const searchOnly = args.includes('--search-only');

  if (!API_KEY) {
    console.error('❌ 缺少 MINIMAX_API_KEY 環境變量');
    process.exit(1);
  }

  console.log('\n🚀 AI 新聞 QA 調試工具\n');

  if (searchOnly) {
    // 使用預設拆解直接測試搜索
    const decomposition = {
      sub_queries: [{ query_id: 1, description: '直接搜索', keywords: [question], time_range: { type: 'all' } }],
      search_intent: 'event_query'
    };
    await testDBSearch(decomposition);
  } else {
    const decomposition = await testIntentDecomposition(question);
    if (decomposition && !intentOnly) {
      await testDBSearch(decomposition);
    }
  }

  console.log('\n✅ 測試完成\n');
}

main().catch(e => {
  console.error('測試失敗:', e);
  process.exit(1);
});
