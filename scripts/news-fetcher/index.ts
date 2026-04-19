#!/usr/bin/env node

import 'dotenv/config';
import { getConfig, RSS_SOURCES, GOOGLE_NEWS_QUERIES, API_SOURCES, REDDIT_SOURCES } from './config';
import { fetchAllRSS } from './sources/rss-fetcher';
import { fetchAllGoogleNews } from './sources/google-news';
import { fetchAllAPIs } from './sources/api-fetcher';
import { fetchFullContentBatch } from './sources/crawler';
import { deduplicateNews, deduplicateAgainstExisting } from './processor/dedup';
import { appendToCsv, readLastTimestampFromCsv, readAllIdsFromCsv } from './storage/csv-writer';
import { aiDedup } from './processor/ai-dedup';
import { syncNewsToDB, closePool } from './storage/db-sync';
import { initLogger, logger } from './utils/logger';
import type { NewsItem } from './types';

export async function main() {
  const config = getConfig();

  // Initialize logger
  initLogger(config.logLevel, config.logFile);

  const mode = process.argv[2] || config.runMode;

  logger.info('🚀 全球新聞抓取系統啟動');
  logger.info(`   運行模式: ${mode}`);
  logger.info(`   CSV 路徑: ${config.csvFilePath}`);

  // Determine time range
  let fromDate: Date;
  const toDate = new Date();

  if (mode === 'single') {
    // Single run mode: from last timestamp in CSV to now
    const lastTimestamp = await readLastTimestampFromCsv(config.csvFilePath);
    if (lastTimestamp) {
      // Add 1 second to avoid duplicates
      fromDate = new Date(lastTimestamp.getTime() + 1000);
      logger.info(`📅 時間範圍: ${fromDate.toISOString()} → ${toDate.toISOString()}`);
    } else {
      // First run: get last 24 hours
      fromDate = new Date(Date.now() - config.singleRunDefaultHours * 60 * 60 * 1000);
      logger.info(`📅 首次運行，時間範圍: 過去 ${config.singleRunDefaultHours} 小時`);
    }
  } else {
    // Cron mode: get last N minutes
    fromDate = new Date(Date.now() - config.cronIntervalMinutes * 60 * 1000);
    logger.info(`📅 定時模式，時間範圍: 過去 ${config.cronIntervalMinutes} 分鐘`);
  }

  // Read existing IDs for dedup
  const existingIds = await readAllIdsFromCsv(config.csvFilePath);

  const startTime = Date.now();
  const errors: Array<{ source: string; error: string }> = [];

  // ============================================
  // Phase 1: Fetch from all sources
  // ============================================
  logger.info('\n📡 ===== Phase 1: RSS 抓取 =====');
  const rssItems = await fetchAllRSS(
    [...RSS_SOURCES, ...REDDIT_SOURCES],
    fromDate,
    toDate,
  );

  logger.info('\n🔍 ===== Phase 1: Google News 抓取 =====');
  const googleItems = await fetchAllGoogleNews(GOOGLE_NEWS_QUERIES, fromDate, toDate);

  logger.info('\n🔑 ===== Phase 1: API 抓取 =====');
  const apiItems = await fetchAllAPIs(API_SOURCES, fromDate, toDate);

  // Combine all items
  let allItems = [...rssItems, ...googleItems, ...apiItems];
  logger.info(`\n📊 Phase 1 完成: 總共 ${allItems.length} 條原始新聞`);

  // ============================================
  // Phase 2: Deduplication
  // ============================================
  logger.info('\n🔄 ===== Phase 2: 去重 =====');

  // Remove items already in CSV
  allItems = deduplicateAgainstExisting(allItems, existingIds);
  logger.info(`   移除已存在: ${rssItems.length + googleItems.length + apiItems.length - allItems.length} 條`);

  // Internal deduplication
  allItems = deduplicateNews(allItems);

  // Filter by time range
  allItems = allItems.filter(item => {
    const pubDate = new Date(item.publish_time);
    return !isNaN(pubDate.getTime()) && pubDate >= fromDate && pubDate <= toDate;
  });

  // Apply max limit
  if (config.maxNewsPerRun > 0 && allItems.length > config.maxNewsPerRun) {
    logger.info(`   限制: ${allItems.length} → ${config.maxNewsPerRun} 條`);
    allItems = allItems.slice(0, config.maxNewsPerRun);
  }

  logger.info(`✅ Phase 2 完成: ${allItems.length} 條不重複新聞`);

  if (allItems.length === 0) {
    logger.info('📭 無新聞需要處理');
    return;
  }

  // ============================================
  // Phase 3: Full content fetching
  // ============================================
  if (config.fetchFullContent) {
    logger.info('\n📄 ===== Phase 3: 全文抓取 =====');
    // 移除數量限制，允許抓取所有需要全文的新聞
    const needFetchAll = allItems.map(item => ({
      url: item.url,
      hasContent: !!(item.content && item.content.length > 100),
    }));
    const needFetch = needFetchAll; // 不限制數量

    logger.info(`   全文抓取：${needFetch.length} 條需要抓取全文`);

    // 添加重試機制（最多 5 次）
    let retries = 0;
    const maxRetries = 5;
    let contentMap = new Map<string, string>();

    while (retries < maxRetries) {
      try {
        contentMap = await fetchFullContentBatch(needFetch, config.maxConcurrentFetch);
        logger.info(`✅ 全文抓取成功 (${contentMap.size}/${needFetch.length} 條)`);
        break;
      } catch (error: any) {
        retries++;
        if (retries < maxRetries) {
          const waitTime = retries * 2000; // 指數退避：2s, 4s, 6s, 8s
          logger.warn(`⚠️ 全文抓取失敗，${retries}/${maxRetries} 次重試，等待 ${waitTime/1000} 秒...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          logger.error(`❌ 全文抓取失敗，已重試 ${maxRetries} 次，跳過全文抓取`);
        }
      }
    }

    // Update items with fetched content
    for (const item of allItems) {
      const fetchedContent = contentMap.get(item.url);
      if (fetchedContent && fetchedContent.length > (item.content?.length || 0)) {
        item.content = fetchedContent;
      }
    }
  }

  // ============================================
  // Phase 4: Save to CSV (master version - append all new items)
  // ============================================
  logger.info('\n💾 ===== Phase 4: 保存到 Master CSV =====');
  await appendToCsv(allItems, config.csvFilePath);
  logger.info(`✅ Master CSV 已更新：${config.csvFilePath}`);

  // ============================================
  // Phase 5: AI Dedup (只對本輪新新聞去重，生成獨立文件)
  // ============================================
  const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';

  if (MINIMAX_API_KEY && allItems.length > 0) {
    logger.info('\n🤖 ===== Phase 5: AI 去重（生成本輪獨立文件）=====');
    
    // 只對本輪新新聞執行 AI 去重
    const newDeduped = await aiDedup(allItems);
    logger.info(`🤖 本輪 AI 去重：${allItems.length} → ${newDeduped.length} (移除 ${allItems.length - newDeduped.length} 條重複)`);
    
    // 生成帶時間戳的文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
    const dedupedPath = config.csvFilePath.replace('.csv', `_deduped_${timestamp}.csv`);
    
    // 寫入新文件（覆蓋模式，包含 header）
    await appendToCsv(newDeduped, dedupedPath);
    logger.info(`💾 本輪去重文件已保存：${dedupedPath} (${newDeduped.length} 條)`);
    logger.info(`📄 方便下次單獨處理本輪新聞`);
  } else if (!MINIMAX_API_KEY) {
    logger.info('\n⏭️ 跳過 AI 去重（MINIMAX_API_KEY 未設置）');
  } else {
    logger.info('\n⏭️ 無新新聞，跳過 AI 去重');
  }

  // ============================================
  // Phase 6: Sync to Database
  // ============================================
  const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (POSTGRES_URL && allItems.length > 0) {
    logger.info('\n🗄️ ===== Phase 6: 同步到數據庫 =====');
    try {
      const syncResult = await syncNewsToDB(allItems);
      logger.info(`✅ Phase 6 完成: 插入 ${syncResult.inserted}, 更新 ${syncResult.updated}, 跳過 ${syncResult.skipped}`);
    } catch (e: any) {
      logger.error(`❌ Phase 6 數據庫同步失敗: ${e.message}`);
    }
    await closePool();
  } else if (!POSTGRES_URL) {
    logger.info('\n⏭️ 跳過 DB 同步（POSTGRES_URL 未設置）');
  } else {
    logger.info('\n⏭️ 無新新聞，跳過 DB 同步');
  }

  // ============================================
  // Summary
  // ============================================
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info(`\n🎉 ===== 完成 =====`);
  logger.info(`   耗時: ${duration}s`);
  logger.info(`   新增新聞: ${allItems.length} 條`);
  logger.info(`   RSS: ${rssItems.length} 條`);
  logger.info(`   Google News: ${googleItems.length} 條`);
  logger.info(`   API: ${apiItems.length} 條`);
  logger.info(`   錯誤: ${errors.length}`);
}

// Handle MINIMAX_API_KEY check
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';

// Run
main().catch(error => {
  console.error('❌ 執行失敗:', error);
  closePool().catch(() => {});
  process.exit(1);
});