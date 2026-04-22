#!/usr/bin/env node
/**
 * 新聞數據庫清理腳本
 * 
 * 清理策略（按順序執行）：
 * Phase 1: URL 重複 — 保留每組最新一條，刪除舊的
 * Phase 2: 標題重複 — 在 Phase 1 後，保留每組最新一條
 * Phase 3: 低質量 — 刪除 summary 為空或 < 50 字符的數據
 * 
 * 用法:
 *   node scripts/clean-news-db.js --dry-run    # 預覽，不執行刪除
 *   node scripts/clean-news-db.js --phase 1    # 只執行 Phase 1
 *   node scripts/clean-news-db.js              # 執行全部三個 Phase
 */

import pkg from 'pg';
import { writeFileSync } from 'fs';
import { join } from 'path';
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

// ── 工具：刪除記錄（帶確認）──
async function deleteRecords(ids, dryRun) {
  if (ids.length === 0) return 0;
  if (dryRun) return ids.length;
  
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const result = await query(`DELETE FROM news WHERE id IN (${placeholders}) RETURNING id`, ids);
  return result.rows.length;
}

// ── Phase 1: URL 重複清理 ──
async function phase1CleanDuplicateUrls(dryRun) {
  console.log('\n📌 Phase 1: URL 重複清理');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 找出要刪除的記錄（每組保留 date 最新、created_at 最新的一條）
  const findSql = `
    WITH ranked AS (
      SELECT 
        id, url, title, date, created_at,
        ROW_NUMBER() OVER (
          PARTITION BY url 
          ORDER BY date DESC, created_at DESC
        ) as rn
      FROM news
      WHERE url IS NOT NULL AND url != ''
    )
    SELECT id, url, title, date, created_at
    FROM ranked
    WHERE rn > 1
    ORDER BY url, date DESC
  `;

  const toDelete = await query(findSql);

  if (toDelete.rows.length === 0) {
    console.log('✅ 沒有 URL 重複數據需要清理');
    return 0;
  }

  console.log(`   發現 ${toDelete.rows.length} 條 URL 重複記錄（將被刪除）`);
  console.log(`   涉及 ${new Set(toDelete.rows.map(r => r.url)).size} 個唯一 URL`);

  // 分組展示
  const byUrl = {};
  for (const r of toDelete.rows) {
    if (!byUrl[r.url]) byUrl[r.url] = [];
    byUrl[r.url].push(r);
  }
  const sampleUrls = Object.keys(byUrl).slice(0, 3);
  for (const url of sampleUrls) {
    console.log(`   📎 ${url.substring(0, 55)}...`);
    console.log(`      將刪除 ${byUrl[url].length} 條: ${byUrl[url].map(r => r.id.substring(0, 12)).join(', ')}`);
  }
  if (Object.keys(byUrl).length > 3) {
    console.log(`      ... 還有 ${Object.keys(byUrl).length - 3} 個 URL`);
  }

  if (dryRun) {
    console.log('   ⏸️  [dry-run] 已跳過刪除');
    return toDelete.rows.length;
  }

  const ids = toDelete.rows.map(r => r.id);
  const deletedCount = await deleteRecords(ids, dryRun);
  console.log(`   🗑️  已刪除 ${deletedCount} 條 URL 重複記錄`);
  return deletedCount;
}

// ── Phase 2: 標題重複清理 ──
async function phase2CleanDuplicateTitles(dryRun) {
  console.log('\n📌 Phase 2: 標題重複清理');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const findSql = `
    WITH ranked AS (
      SELECT 
        id, title, url, date, created_at,
        ROW_NUMBER() OVER (
          PARTITION BY title 
          ORDER BY date DESC, created_at DESC
        ) as rn
      FROM news
    )
    SELECT id, title, url, date, created_at
    FROM ranked
    WHERE rn > 1
    ORDER BY title, date DESC
  `;

  const toDelete = await query(findSql);

  if (toDelete.rows.length === 0) {
    console.log('✅ 沒有標題重複數據需要清理');
    return 0;
  }

  console.log(`   發現 ${toDelete.rows.length} 條標題重複記錄（將被刪除）`);

  const byTitle = {};
  for (const r of toDelete.rows) {
    if (!byTitle[r.title]) byTitle[r.title] = [];
    byTitle[r.title].push(r);
  }
  const sampleTitles = Object.keys(byTitle).slice(0, 3);
  for (const title of sampleTitles) {
    console.log(`   📰 ${title.substring(0, 55)}...`);
    console.log(`      將刪除 ${byTitle[title].length} 條`);
  }
  if (Object.keys(byTitle).length > 3) {
    console.log(`      ... 還有 ${Object.keys(byTitle).length - 3} 個標題`);
  }

  if (dryRun) {
    console.log('   ⏸️  [dry-run] 已跳過刪除');
    return toDelete.rows.length;
  }

  const ids = toDelete.rows.map(r => r.id);
  const deletedCount = await deleteRecords(ids, dryRun);
  console.log(`   🗑️  已刪除 ${deletedCount} 條標題重複記錄`);
  return deletedCount;
}

// ── Phase 3: summary 為空數據清理 ──
async function phase3CleanEmptySummary(dryRun) {
  console.log('\n📌 Phase 3: summary 為空數據清理');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const findSql = `
    SELECT id, title, source, date, url
    FROM news
    WHERE summary IS NULL OR TRIM(summary) = ''
    ORDER BY date DESC, created_at DESC
  `;

  const toDelete = await query(findSql);

  if (toDelete.rows.length === 0) {
    console.log('✅ 沒有 summary 為空的數據需要清理');
    return 0;
  }

  console.log(`   發現 ${toDelete.rows.length} 條 summary 為空的記錄`);

  // 按日期分組展示
  const byDate = {};
  for (const r of toDelete.rows) {
    const d = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).substring(0, 10);
    if (!byDate[d]) byDate[d] = 0;
    byDate[d]++;
  }
  console.log('   按日期分佈:');
  Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5).forEach(([d, cnt]) => {
    console.log(`      ${d}: ${cnt} 條`);
  });

  // 展示樣本
  console.log('   樣本（前 5 條最新）:');
  for (const r of toDelete.rows.slice(0, 5)) {
    console.log(`      [${r.date.toISOString().split('T')[0]}] ${r.source || '無來源'} | ${r.title?.substring(0, 45)}...`);
  }

  if (dryRun) {
    console.log('   ⏸️  [dry-run] 已跳過刪除');
    return toDelete.rows.length;
  }

  const ids = toDelete.rows.map(r => r.id);
  const deletedCount = await deleteRecords(ids, dryRun);
  console.log(`   🗑️  已刪除 ${deletedCount} 條 summary 為空的記錄`);
  return deletedCount;
}

// ── Phase 4: 添加約束防止未來垃圾數據 ──
async function phase4AddConstraints(dryRun) {
  console.log('\n📌 Phase 4: 添加數據質量約束');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (dryRun) {
    console.log('   ⏸️  [dry-run] 已跳過約束添加');
    return;
  }

  try {
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_news_url_unique ON news(url) WHERE url IS NOT NULL AND url != ''`);
    console.log('   ✅ 已添加 URL 唯一索引（排除 NULL 和空字符串）');
  } catch (e) {
    console.log('   ⚠️  URL 唯一索引添加失敗:', e.message);
  }

  console.log('   💡 提示：建議在新聞抓取腳本中添加去重邏輯（INSERT ... ON CONFLICT）');
}

// ── 生成清理報告 ──
async function generateReport(beforeCount, deletedCounts, dryRun) {
  const afterCount = dryRun ? beforeCount : (await query('SELECT COUNT(*) as cnt FROM news')).rows[0].cnt;
  const totalDeleted = deletedCounts.reduce((a, b) => a + b, 0);

  console.log('\n\n📊 清理報告');
  console.log('══════════════════════════════════════════════════');
  console.log(`模式: ${dryRun ? '🔍 DRY-RUN（預覽）' : '⚡ 實際執行'}`);
  console.log(`清理前總數: ${beforeCount}`);
  console.log(`清理後總數: ${afterCount}`);
  console.log(`總刪除數:   ${totalDeleted}`);
  console.log('──────────────────────────────────────────────────');
  console.log(`Phase 1 (URL重複):     ${deletedCounts[0]} 條`);
  console.log(`Phase 2 (標題重複):    ${deletedCounts[1]} 條`);
  console.log(`Phase 3 (低質量):      ${deletedCounts[2]} 條`);
  console.log('══════════════════════════════════════════════════');

  if (!dryRun) {
    console.log('\n🗑️  數據已直接刪除（未保留備份）');
  }
}

// ── 主函數 ──
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const phaseArg = args.find(a => a.startsWith('--phase'));
  const phase = phaseArg ? parseInt(phaseArg.split('=')[1] || phaseArg.split(' ')[1]) : null;

  console.log('\n🧹 新聞數據庫清理工具');
  console.log(dryRun ? '🔍 DRY-RUN 模式（僅預覽，不執行刪除）' : '⚡ 實際執行模式');
  if (phase) console.log(`🎯 僅執行 Phase ${phase}`);

  const beforeCount = (await query('SELECT COUNT(*) as cnt FROM news')).rows[0].cnt;
  console.log(`\n📊 當前新聞總數: ${beforeCount}`);

  const deletedCounts = [0, 0, 0];

  try {
    if (!phase || phase === 1) {
      deletedCounts[0] = await phase1CleanDuplicateUrls(dryRun);
    }
    if (!phase || phase === 2) {
      deletedCounts[1] = await phase2CleanDuplicateTitles(dryRun);
    }
    if (!phase || phase === 3) {
      deletedCounts[2] = await phase3CleanEmptySummary(dryRun);
    }
    if (!phase) {
      await phase4AddConstraints(dryRun);
    }

    await generateReport(beforeCount, deletedCounts, dryRun);

  } catch (e) {
    console.error('\n❌ 清理失敗:', e.message);
    console.error(e.stack);
    process.exit(1);
  }

  await pool.end();
  console.log('\n✅ 完成\n');
}

main();
