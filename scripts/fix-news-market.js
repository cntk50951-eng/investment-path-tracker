#!/usr/bin/env node
/**
 * Fix misclassified news in database
 * This script updates news items that were incorrectly classified as 'US' when they should be 'HK'
 */

import pkg from 'pg';

const { Pool } = pkg;

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ 缺少 POSTGRES_URL 或 DATABASE_URL 環境變數');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Keywords that indicate HK/CN market
const HK_KEYWORDS = [
  'hang seng', 'hong kong', '港股', '恆生', 'hsbc', 'hk stock', 'hsi',
  '中國', 'a股', '上證', '深圳', '創業板', '36kr', '36氪',
  '立讯精密', '易森动力', '卓驭科技', '中芯國際', '中芯国际',
  '財新', '新浪财经', '明報', '香港經濟日報', 'hk.finance.yahoo',
  'yahoo finance hk', 'scmp', 'south china morning post',
  'investing.com 香港', '聯發科', '台積電', '台灣',
];

function shouldBeHK(title, summary, source, url) {
  const text = ((title || '') + ' ' + (summary || '') + ' ' + (source || '') + ' ' + (url || '')).toLowerCase();
  return HK_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

async function fixMisclassifiedNews() {
  console.log('🔍 檢查錯誤分類的新聞...');
  
  try {
    // Find US news that should be HK
    const result = await query(
      "SELECT id, title, summary, source, url, market FROM news WHERE market = 'US'",
      []
    );
    
    console.log(`📊 找到 ${result.rows.length} 條 US 新聞需要檢查`);
    
    let fixed = 0;
    const toFix = [];
    
    for (const row of result.rows) {
      if (shouldBeHK(row.title, row.summary, row.source, row.url)) {
        toFix.push(row.id);
      }
    }
    
    console.log(`🎯 發現 ${toFix.length} 條需要修正為 HK`);
    
    if (toFix.length > 0) {
      // Update in batches
      const BATCH_SIZE = 100;
      for (let i = 0; i < toFix.length; i += BATCH_SIZE) {
        const batch = toFix.slice(i, i + BATCH_SIZE);
        await query(
          "UPDATE news SET market = 'HK', updated_at = CURRENT_TIMESTAMP WHERE id = ANY($1)",
          [batch]
        );
        fixed += batch.length;
        console.log(`  ✅ 已修正 ${fixed}/${toFix.length}`);
      }
    }
    
    console.log(`\n🎉 完成！共修正 ${fixed} 條新聞`);
    
    // Show final distribution
    const dist = await query('SELECT market, COUNT(*) FROM news GROUP BY market', []);
    console.log('\n📈 最終分佈:');
    dist.rows.forEach(r => {
      console.log(`  ${r.market || 'NULL'}: ${r.count}`);
    });
    
  } catch (error) {
    console.error('❌ 修正失敗:', error.message);
  } finally {
    await pool.end();
  }
}

fixMisclassifiedNews();
