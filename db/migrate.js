#!/usr/bin/env node
/**
 * 數據庫遷移腳本
 * 創建表結構並遷移 JSON 數據到 PostgreSQL
 */

import pkg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// 創建連接池
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

// 輔助函數
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
  console.log('🚀 開始數據庫遷移...\n');
  
  try {
    // 創建表
    console.log('📊 創建數據庫表結構...');
    
    const createTablesSQL = `
      -- 1. 元數據表
      CREATE TABLE IF NOT EXISTS metadata (
        id SERIAL PRIMARY KEY,
        version VARCHAR(20) NOT NULL,
        last_updated TIMESTAMP NOT NULL,
        next_scheduled_update TIMESTAMP,
        data_source VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. 宏觀指標表
      CREATE TABLE IF NOT EXISTS macros (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        value VARCHAR(50) NOT NULL,
        trend VARCHAR(20),
        status VARCHAR(20) NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. 路徑節點表
      CREATE TABLE IF NOT EXISTS nodes (
        id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        sub VARCHAR(200),
        color VARCHAR(20) NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        prob INTEGER NOT NULL DEFAULT 0,
        current BOOLEAN DEFAULT FALSE,
        market VARCHAR(10) DEFAULT 'US',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. 板塊分配表
      CREATE TABLE IF NOT EXISTS allocations (
        id SERIAL PRIMARY KEY,
        node_id VARCHAR(10) REFERENCES nodes(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        tier VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. 路徑切換表
      CREATE TABLE IF NOT EXISTS switches (
        id VARCHAR(20) PRIMARY KEY,
        from_node VARCHAR(10) NOT NULL,
        to_node VARCHAR(10) NOT NULL,
        time VARCHAR(50),
        trigger TEXT,
        path TEXT,
        description TEXT,
        next_check VARCHAR(200),
        market VARCHAR(10) DEFAULT 'US',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 6. 確認信號表
      CREATE TABLE IF NOT EXISTS confirm_signals (
        id SERIAL PRIMARY KEY,
        switch_id VARCHAR(20) REFERENCES switches(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        status VARCHAR(20) NOT NULL,
        actual TEXT,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 7. 新聞表
      CREATE TABLE IF NOT EXISTS news (
        id VARCHAR(50) PRIMARY KEY,
        market VARCHAR(10) DEFAULT 'US',
        date DATE NOT NULL,
        title VARCHAR(500) NOT NULL,
        source VARCHAR(200),
        severity VARCHAR(20) NOT NULL,
        summary TEXT,
        impact TEXT,
        url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 8. 新聞影響切換關聯表
      CREATE TABLE IF NOT EXISTS news_affects (
        id SERIAL PRIMARY KEY,
        news_id VARCHAR(50) REFERENCES news(id) ON DELETE CASCADE,
        switch_id VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 9. 新聞關聯路徑表
      CREATE TABLE IF NOT EXISTS news_related_paths (
        id SERIAL PRIMARY KEY,
        news_id VARCHAR(50) REFERENCES news(id) ON DELETE CASCADE,
        path_id VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 10. 新聞標籤表
      CREATE TABLE IF NOT EXISTS news_tags (
        id SERIAL PRIMARY KEY,
        news_id VARCHAR(50) REFERENCES news(id) ON DELETE CASCADE,
        tag VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 11. 警報表
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        active BOOLEAN DEFAULT FALSE,
        level VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP,
        title VARCHAR(200),
        message TEXT,
        action TEXT,
        market VARCHAR(10) DEFAULT 'US',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 12. 閾值警報表
      CREATE TABLE IF NOT EXISTS threshold_alerts (
        id SERIAL PRIMARY KEY,
        switch_id VARCHAR(20) REFERENCES switches(id),
        progress DECIMAL(5,4) NOT NULL,
        tier VARCHAR(50) NOT NULL,
        next_trigger TEXT,
        market VARCHAR(10) DEFAULT 'US',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 索引
      CREATE INDEX IF NOT EXISTS idx_news_date ON news(date DESC);
      CREATE INDEX IF NOT EXISTS idx_news_severity ON news(severity);
      CREATE INDEX IF NOT EXISTS idx_news_market ON news(market);
      CREATE INDEX IF NOT EXISTS idx_nodes_prob ON nodes(prob DESC);
      CREATE INDEX IF NOT EXISTS idx_nodes_current ON nodes(current);
      CREATE INDEX IF NOT EXISTS idx_switches_from ON switches(from_node);
      CREATE INDEX IF NOT EXISTS idx_switches_to ON switches(to_node);
    `;
    
    await query(createTablesSQL);
    console.log('✅ 表結構創建成功');
    
    // 讀取 JSON 數據
    console.log('\n📄 讀取 JSON 數據...');
    const data = JSON.parse(readFileSync(join(process.cwd(), 'public', 'data', 'latest.json'), 'utf-8'));
    console.log('✅ 數據加載成功');
    
    // 遷移數據
    console.log('\n🔄 遷移數據...');
    
    // 1. metadata
    await query(`
      INSERT INTO metadata (version, last_updated, next_scheduled_update, data_source)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [data.meta.version, data.meta.lastUpdated, data.meta.nextScheduledUpdate || null, data.meta.dataSource || null]);
    
    // 2. macros
    await query('DELETE FROM macros');
    for (const macro of data.macros || []) {
      await query(`
        INSERT INTO macros (name, value, trend, status, note)
        VALUES ($1, $2, $3, $4, $5)
      `, [macro.name, macro.value, macro.trend, macro.status, macro.note || null]);
    }
    
    // 3. nodes & allocations
    await query('DELETE FROM allocations');
    await query('DELETE FROM nodes');
    for (const [id, node] of Object.entries(data.nodes || {})) {
      await query(`
        INSERT INTO nodes (id, name, sub, color, x, y, prob, current, market)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [id, node.name, node.sub, node.color, node.x, node.y, node.prob, node.current || false, 'US']);
      
      if (node.alloc) {
        for (const alloc of node.alloc) {
          await query(`
            INSERT INTO allocations (node_id, name, tier)
            VALUES ($1, $2, $3)
          `, [id, alloc.n, alloc.tier]);
        }
      }
    }
    
    // 4. switches & confirm_signals
    await query('DELETE FROM confirm_signals');
    await query('DELETE FROM switches');
    for (const [id, sw] of Object.entries(data.switches || {})) {
      await query(`
        INSERT INTO switches (id, from_node, to_node, time, trigger, path, description, next_check, market)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [id, sw.from, sw.to, sw.time, sw.trigger, sw.path, sw.desc, sw.nextCheck, 'US']);
      
      if (sw.confirms) {
        for (const confirm of sw.confirms) {
          await query(`
            INSERT INTO confirm_signals (switch_id, text, status, actual, note)
            VALUES ($1, $2, $3, $4, $5)
          `, [id, confirm.text, confirm.status, confirm.actual, confirm.note || null]);
        }
      }
    }
    
    // 5. news & related tables
    await query('DELETE FROM news_tags');
    await query('DELETE FROM news_related_paths');
    await query('DELETE FROM news_affects');
    await query('DELETE FROM news');
    
    for (const newsItem of data.news || []) {
      await query(`
        INSERT INTO news (id, market, date, title, source, severity, summary, impact, url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [newsItem.id, newsItem.market || 'US', newsItem.date, newsItem.title, newsItem.source, 
          newsItem.severity, newsItem.summary, newsItem.impact || null, newsItem.url || null]);
      
      // affects
      if (newsItem.affects) {
        for (const switchId of newsItem.affects) {
          await query(`INSERT INTO news_affects (news_id, switch_id) VALUES ($1, $2)`, [newsItem.id, switchId]);
        }
      }
      
      // relatedPaths
      if (newsItem.relatedPaths) {
        for (const pathId of newsItem.relatedPaths) {
          await query(`INSERT INTO news_related_paths (news_id, path_id) VALUES ($1, $2)`, [newsItem.id, pathId]);
        }
      }
      
      // tags
      if (newsItem.tags) {
        for (const tag of newsItem.tags) {
          await query(`INSERT INTO news_tags (news_id, tag) VALUES ($1, $2)`, [newsItem.id, tag]);
        }
      }
    }
    
    // 6. alerts
    await query('DELETE FROM alerts');
    if (data.alert) {
      await query(`
        INSERT INTO alerts (active, level, timestamp, title, message, action, market)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [data.alert.active, data.alert.level, data.alert.timestamp, data.alert.title, 
          data.alert.message, data.alert.action, 'US']);
    }
    
    // 7. threshold_alerts
    await query('DELETE FROM threshold_alerts');
    if (data.thresholdAlert) {
      await query(`
        INSERT INTO threshold_alerts (switch_id, progress, tier, next_trigger, market)
        VALUES ($1, $2, $3, $4, $5)
      `, [data.thresholdAlert.switchId, data.thresholdAlert.progress, 
          data.thresholdAlert.tier, data.thresholdAlert.nextTrigger, 'US']);
    }
    
    console.log('✅ 數據遷移成功');
    
    // 統計信息
    console.log('\n📊 統計信息:');
    const tables = ['metadata', 'macros', 'nodes', 'switches', 'news', 'alerts'];
    for (const table of tables) {
      const result = await query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   - ${table}: ${result.rows[0].count} 條記錄`);
    }
    
    console.log('\n🎉 遷移完成！\n');
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 遷移失敗:', error);
    await pool.end();
    process.exit(1);
  }
}

// 執行
runMigration();
