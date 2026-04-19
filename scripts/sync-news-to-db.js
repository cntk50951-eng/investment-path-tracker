#!/usr/bin/env node
/**
 * 將 news_raw.csv 的新聞數據同步到 PostgreSQL 數據庫
 * 用於 AI 查詢的數據源
 * 
 * 策略：只同步財經相關新聞，過濾掉無關分類（體育、娛樂等）
 * 對現有新聞使用 UPSERT，避免重複
 */

import pkg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
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

// 無關新聞分類關鍵字（過濾掉這些）
const IRRELEVANT_CATEGORIES = [
  'sports', 'entertainment', 'celebrity', 'gaming', 'lifestyle',
  'fashion', 'food', 'travel', 'weather', 'obituary',
];

// 無關標題關鍵字（英文）
const IRRELEVANT_TITLE_KEYWORDS = [
  'IPL', 'cricket', 'football match', 'Premier League', 'La Liga', 'Serie A',
  'Bundesliga', 'NBA', 'NFL', 'MLB', 'NHL', 'tennis', 'golf', 'boxing',
  'movie review', 'album review', 'TV show', 'reality show', 'celebrity',
  'recipe', 'cooking', 'restaurant review', 'fashion week',
  'Realme', 'iPhone leak', 'phone leak', 'smartphone leak',
];

function isRelevantNews(row) {
  const category = (row.category || '').toLowerCase();
  const title = (row.title || '').toLowerCase();
  
  // 過濾無關分類
  for (const cat of IRRELEVANT_CATEGORIES) {
    if (category.includes(cat)) return false;
  }
  
  // 過濾無關標題
  for (const kw of IRRELEVANT_TITLE_KEYWORDS) {
    if (title.includes(kw.toLowerCase())) return false;
  }
  
  return true;
}

// 簡單的嚴重性判斷
function inferSeverity(row) {
  const title = (row.title || '').toLowerCase();
  const summary = (row.summary || '').toLowerCase();
  const text = title + ' ' + summary;
  
  if (/crisis|crash|collapse|war|conflict|sanction|tariff|recession|inflation surge/i.test(text)) {
    return 'critical';
  }
  if (/fed|interest rate|cpi|gdp|unemployment|trade war|central bank/i.test(text)) {
    return 'medium';
  }
  return 'medium';
}

// 推斷市場
function inferMarket(row) {
  const title = (row.title || '') + ' ' + (row.summary || '');
  if (/hang seng|hong kong|港股|恆生|hsbc|hk stock|hsi/i.test(title)) {
    return 'HK';
  }
  return 'US';
}

// 生成簡短 ID
function generateId(source, idx) {
  const hash = source.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  return `csv_${hash}_${idx}`.substring(0, 50);
}

async function syncCSVToDB() {
  console.log('🚀 開始同步 news_raw.csv 到數據庫...\n');
  
  // 1. 讀取 CSV
  const csvPath = process.env.CSV_FILE_PATH || './data/news_raw.csv';
  console.log(`📄 讀取 CSV: ${csvPath}`);
  
  let csvContent;
  try {
    csvContent = readFileSync(csvPath, 'utf-8');
  } catch (e) {
    console.error('❌ 無法讀取 CSV 文件:', e.message);
    process.exit(1);
  }
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });
  
  console.log(`📊 CSV 總記錄數: ${records.length}`);
  
  // 2. 過濾相關新聞
  const relevant = records.filter(isRelevantNews);
  console.log(`✅ 過濾後財經相關新聞: ${relevant.length}`);
  console.log(`❌ 過濾掉無關新聞: ${records.length - relevant.length}`);
  
  // 3. 準備數據
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  
  for (let i = 0; i < relevant.length; i++) {
    const row = relevant[i];
    const id = row.id || generateId(row.source || 'unknown', i);
    const title = (row.title || '').substring(0, 500);
    const source = (row.source || 'unknown').substring(0, 200);
    const severity = row.severity || inferSeverity(row);
    const market = row.market || inferMarket(row);
    const summary = (row.summary || row.content || '').substring(0, 2000);
    const url = (row.url || '').substring(0, 500);
    
    // 解析日期
    let date;
    try {
      const publishTime = row.publish_time || row.fetch_time;
      date = publishTime ? new Date(publishTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    } catch {
      date = new Date().toISOString().split('T')[0];
    }
    
    // 解析發布時間
    let publishedTime = null;
    try {
      if (row.publish_time) {
        const d = new Date(row.publish_time);
        publishedTime = `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
      }
    } catch {}
    
    try {
      const existing = await query('SELECT id FROM news WHERE id = $1', [id]);
      
      if (existing.rows.length > 0) {
        // 更新
        await query(
          `UPDATE news SET title = $1, source = $2, severity = $3, summary = $4, 
           url = $5, published_time = $6, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $7`,
          [title, source, severity, summary, url, publishedTime, id]
        );
        updated++;
      } else {
        // 插入
        await query(
          `INSERT INTO news (id, market, date, title, source, severity, summary, url, published_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [id, market, date, title, source, severity, summary, url, publishedTime]
        );
        inserted++;
      }
    } catch (e) {
      console.error(`⚠️ 處理新聞 ${id} 出錯:`, e.message);
      skipped++;
    }
    
    // 進度顯示
    if ((i + 1) % 50 === 0) {
      console.log(`  進度: ${i + 1}/${relevant.length} (插入: ${inserted}, 更新: ${updated}, 跳過: ${skipped})`);
    }
  }
  
  console.log(`\n📊 同步完成！`);
  console.log(`   插入: ${inserted} 條`);
  console.log(`   更新: ${updated} 條`);
  console.log(`   跳過: ${skipped} 條`);
  console.log(`   總計: ${relevant.length} 條財經新聞`);
  
  // 4. 顯示數據庫狀態
  const countResult = await query('SELECT COUNT(*) as total, MIN(date) as earliest, MAX(date) as latest FROM news');
  console.log(`\n📈 數據庫狀態:`);
  console.log(`   總新聞數: ${countResult.rows[0].total}`);
  console.log(`   日期範圍: ${countResult.rows[0].earliest} ~ ${countResult.rows[0].latest}`);
  
  await pool.end();
  process.exit(0);
}

syncCSVToDB().catch(e => {
  console.error('❌ 同步失敗:', e);
  pool.end();
  process.exit(1);
});