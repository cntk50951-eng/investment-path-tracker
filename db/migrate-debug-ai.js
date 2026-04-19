#!/usr/bin/env node
/**
 * 數據庫遷移腳本 — 添加新字段
 * - users 表添加 debug_mode 和 debug_visibility_mode 字段
 * - 創新聞 AI 查詢緩存表
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
  console.log('🚀 開始數據庫遷移（添加新字段）...\n');

  try {
    // 1. 用戶表添加 debug_mode 和 debug_visibility_mode
    console.log('📊 更新 users 表...');
    
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS debug_mode BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS debug_visibility_mode VARCHAR(20) DEFAULT 'subscription'
    `);
    console.log('✅ users 表更新完成（添加 debug_mode, debug_visibility_mode）');

    // 2. 創建 news_ai_cache 表（新聞 AI 查詢緩存）
    console.log('\n📊 創建 news_ai_cache 表...');
    
    await query(`
      CREATE TABLE IF NOT EXISTS news_ai_cache (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        news_snapshot_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        hit_count INTEGER DEFAULT 1
      )
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_news_ai_cache_question 
      ON news_ai_cache(question)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_news_ai_cache_expires 
      ON news_ai_cache(expires_at)
    `);
    
    console.log('✅ news_ai_cache 表創建完成');

    // 3. 更新管理員帳戶的 debug_mode
    console.log('\n📊 設置管理員帳戶...');
    
    await query(`
      UPDATE users 
      SET debug_mode = TRUE, debug_visibility_mode = 'subscription'
      WHERE email = 'cntk50951@gmail.com'
    `);
    console.log('✅ 管理員帳戶設置完成');

    console.log('\n🎉 遷移完成！\n');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 遷移失敗:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();