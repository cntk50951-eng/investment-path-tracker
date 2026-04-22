#!/usr/bin/env node
/**
 * AI 聊天搜索性能優化索引遷移
 * 添加 pg_trgm GIN 索引加速 ILIKE 模糊搜索
 */

import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
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

async function runMigration() {
  console.log('🚀 開始創建 AI 聊天搜索優化索引...\n');

  try {
    // 1. 啟用 pg_trgm 擴展（模糊搜索加速）
    console.log('📦 啟用 pg_trgm 擴展...');
    await query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    console.log('✅ pg_trgm 擴展已啟用');

    // 2. 為 news.title 創建 GIN 索引（加速 ILIKE 搜索）
    console.log('📦 創建 news.title GIN 索引...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_news_title_trgm 
      ON news USING gin (title gin_trgm_ops)
    `);
    console.log('✅ idx_news_title_trgm 已創建');

    // 3. 為 news.summary 創建 GIN 索引
    console.log('📦 創建 news.summary GIN 索引...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_news_summary_trgm 
      ON news USING gin (summary gin_trgm_ops)
    `);
    console.log('✅ idx_news_summary_trgm 已創建');

    // 4. 為 news_tags.tag 創建 GIN 索引
    console.log('📦 創建 news_tags.tag GIN 索引...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_news_tags_tag_trgm 
      ON news_tags USING gin (tag gin_trgm_ops)
    `);
    console.log('✅ idx_news_tags_tag_trgm 已創建');

    // 5. 複合索引：market + date（加速市場過濾+時間排序）
    console.log('📦 創建 market+date 複合索引...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_news_market_date 
      ON news (market, date DESC)
    `);
    console.log('✅ idx_news_market_date 已創建');

    // 6. 統計信息更新
    console.log('📊 更新表統計信息...');
    await query('ANALYZE news');
    await query('ANALYZE news_tags');
    console.log('✅ 統計信息已更新');

    console.log('\n🎉 索引創建完成！');
    console.log('\n索引列表:');
    const idxResult = await query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('news', 'news_tags') 
      ORDER BY tablename, indexname
    `);
    for (const row of idxResult.rows) {
      console.log(`  - ${row.indexname}`);
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 遷移失敗:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
