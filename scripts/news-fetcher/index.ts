#!/usr/bin/env node

import 'dotenv/config';
import { getConfig, RSS_SOURCES, GOOGLE_NEWS_QUERIES, API_SOURCES, REDDIT_SOURCES } from './config';
import { fetchAllRSS } from './sources/rss-fetcher';
import { fetchAllGoogleNews } from './sources/google-news';
import { fetchAllAPIs } from './sources/api-fetcher';
import { fetchFullContentBatch } from './sources/crawler';
import { deduplicateNews, deduplicateAgainstExisting } from './processor/dedup';
import { appendToCsv, readLastTimestampFromCsv, readAllIdsFromCsv, readItemsFromCsvSince } from './storage/csv-writer';
import { aiDedup } from './processor/ai-dedup';
import { syncNewsToDB, closePool } from './storage/db-sync';
import { loadCheckpoint, saveCheckpoint, clearCheckpoint, type Checkpoint } from './storage/checkpoint';
import { initLogger, logger } from './utils/logger';
import type { NewsItem } from './types';

export async function main() {
  const config = getConfig();

  // Initialize logger
  initLogger(config.logLevel, config.logFile);

  const mode = process.argv[2] || config.runMode;
  const batchId = new Date().toISOString();

  logger.info('🚀 全球新聞抓取系統啟動');
  logger.info(`   運行模式: ${mode}`);
  logger.info(`   CSV 路徑: ${config.csvFilePath}`);

  // ============================================
  // Checkpoint recovery
  // ============================================
  const checkpoint = loadCheckpoint();
  if (checkpoint) {
    logger.info('🔁 檢測到上次未完成的運行，嘗試恢復...');
    const recovered = await resumeFromCheckpoint(checkpoint, config);
    if (recovered) {
      return;
    }
    logger.warn('⚠️ 恢復失敗，將重新運行完整流程');
    clearCheckpoint();
  }

  // Determine time range
  let fromDate: Date;
  const toDate = new Date();

  if (mode === 'single') {
    const lastTimestamp = await readLastTimestampFromCsv(config.csvFilePath);
    if (lastTimestamp) {
      fromDate = new Date(lastTimestamp.getTime() + 1000);
      logger.info(`📅 時間範圍: ${fromDate.toISOString()} → ${toDate.toISOString()}`);
    } else {
      fromDate = new Date(Date.now() - config.singleRunDefaultHours * 60 * 60 * 1000);
      logger.info(`📅 首次運行，時間範圍: 過去 ${config.singleRunDefaultHours} 小時`);
    }
  } else {
    fromDate = new Date(Date.now() - config.cronIntervalMinutes * 60 * 1000);
    logger.info(`📅 定時模式，時間範圍: 過去 ${config.cronIntervalMinutes} 分鐘`);
  }

  const startTime = Date.now();
  const errors: Array<{ source: string; error: string }> = [];

  // Read existing IDs for dedup (with lookback to avoid unbounded growth)
  const existingIds = await readAllIdsFromCsv(config.csvFilePath, 14);

  // ============================================
  // Phase 1: Fetch from all sources (with error isolation)
  // ============================================
  logger.info('\n📡 ===== Phase 1: 數據抓取 =====');

  let rssItems: NewsItem[] = [];
  let googleItems: NewsItem[] = [];
  let apiItems: NewsItem[] = [];

  try {
    rssItems = await fetchAllRSS([...RSS_SOURCES, ...REDDIT_SOURCES], fromDate, toDate);
  } catch (e: any) {
    logger.error(`❌ RSS 抓取失敗: ${e.message}`);
    errors.push({ source: 'RSS', error: e.message });
  }

  try {
    googleItems = await fetchAllGoogleNews(GOOGLE_NEWS_QUERIES, fromDate, toDate);
  } catch (e: any) {
    logger.error(`❌ Google News 抓取失敗: ${e.message}`);
    errors.push({ source: 'GoogleNews', error: e.message });
  }

  try {
    apiItems = await fetchAllAPIs(API_SOURCES, fromDate, toDate);
  } catch (e: any) {
    logger.error(`❌ API 抓取失敗: ${e.message}`);
    errors.push({ source: 'API', error: e.message });
  }

  let allItems = [...rssItems, ...googleItems, ...apiItems];
  logger.info(`\n📊 Phase 1 完成: 總共 ${allItems.length} 條原始新聞`);

  if (allItems.length === 0) {
    logger.info('📭 無新聞需要處理');
    return;
  }

  saveCheckpoint(batchId, 'fetch', {
    mode,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
    csvFilePath: config.csvFilePath,
  });

  // ============================================
  // Phase 2: Deduplication
  // ============================================
  logger.info('\n🔄 ===== Phase 2: 去重 =====');

  try {
    allItems = deduplicateAgainstExisting(allItems, existingIds);
    logger.info(`   移除已存在: ${rssItems.length + googleItems.length + apiItems.length - allItems.length} 條`);

    allItems = deduplicateNews(allItems);

    allItems = allItems.filter(item => {
      const pubDate = new Date(item.publish_time);
      return !isNaN(pubDate.getTime()) && pubDate >= fromDate && pubDate <= toDate;
    });

    if (config.maxNewsPerRun > 0 && allItems.length > config.maxNewsPerRun) {
      logger.info(`   限制: ${allItems.length} → ${config.maxNewsPerRun} 條`);
      allItems = allItems.slice(0, config.maxNewsPerRun);
    }
  } catch (e: any) {
    logger.error(`❌ Phase 2 去重失敗: ${e.message}`);
    errors.push({ source: 'Dedup', error: e.message });
    // Continue with raw items - better to have duplicates than lose data
  }

  logger.info(`✅ Phase 2 完成: ${allItems.length} 條不重複新聞`);

  if (allItems.length === 0) {
    logger.info('📭 無新聞需要處理');
    clearCheckpoint();
    return;
  }

  saveCheckpoint(batchId, 'dedup', {
    mode,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
    csvFilePath: config.csvFilePath,
  });

  // ============================================
  // Phase 3: Full content fetching
  // ============================================
  if (config.fetchFullContent) {
    logger.info('\n📄 ===== Phase 3: 全文抓取 =====');
    const needFetch = allItems.map(item => ({
      url: item.url,
      hasContent: !!(item.content && item.content.length > 100),
    }));

    logger.info(`   全文抓取：${needFetch.length} 條需要抓取全文`);

    let contentMap = new Map<string, string>();
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        contentMap = await fetchFullContentBatch(needFetch, config.maxConcurrentFetch);
        logger.info(`✅ 全文抓取成功 (${contentMap.size}/${needFetch.length} 條)`);
        break;
      } catch (error: any) {
        retries++;
        if (retries < maxRetries) {
          const waitTime = retries * 2000;
          logger.warn(`⚠️ 全文抓取失敗，${retries}/${maxRetries} 次重試，等待 ${waitTime / 1000} 秒...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          logger.error(`❌ 全文抓取失敗，已重試 ${maxRetries} 次，跳過全文抓取`);
          errors.push({ source: 'FullContent', error: error.message });
        }
      }
    }

    for (const item of allItems) {
      const fetchedContent = contentMap.get(item.url);
      if (fetchedContent && fetchedContent.length > (item.content?.length || 0)) {
        item.content = fetchedContent;
      }
    }
  }

  saveCheckpoint(batchId, 'fullContent', {
    mode,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
    csvFilePath: config.csvFilePath,
  });

  // ============================================
  // Phase 4: Save to CSV (master version - append all new items)
  // ============================================
  logger.info('\n💾 ===== Phase 4: 保存到 Master CSV =====');
  try {
    await appendToCsv(allItems, config.csvFilePath);
    logger.info(`✅ Master CSV 已更新：${config.csvFilePath}`);
  } catch (e: any) {
    logger.error(`❌ Phase 4 寫入 Master CSV 失敗: ${e.message}`);
    errors.push({ source: 'WriteMaster', error: e.message });
    // Master CSV 是關鍵持久化，如果失敗不應繼續後續 Phase
    throw new Error('Master CSV 寫入失敗，中斷運行以確保數據一致性');
  }

  saveCheckpoint(batchId, 'writeMaster', {
    mode,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
    csvFilePath: config.csvFilePath,
  });

  // ============================================
  // Phase 5: AI Dedup (只對本輪新新聞去重)
  // ============================================
  const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
  let dedupedItems: NewsItem[] = allItems;

  if (MINIMAX_API_KEY && allItems.length > 0) {
    logger.info('\n🤖 ===== Phase 5: AI 去重（生成本輪獨立文件 + 分析團隊累加文件）=====');
    try {
      dedupedItems = await aiDedup(allItems);
      logger.info(`🤖 本輪 AI 去重：${allItems.length} → ${dedupedItems.length} (移除 ${allItems.length - dedupedItems.length} 條重複)`);

      // 生成本輪獨立時間戳文件
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const dedupedPath = config.csvFilePath.replace('.csv', `_deduped_${timestamp}.csv`);
      await appendToCsv(dedupedItems, dedupedPath);
      logger.info(`💾 本輪去重文件已保存：${dedupedPath} (${dedupedItems.length} 條)`);

      // 累加到分析團隊 master 文件（持續追加）
      const analyticsPath = config.csvFilePath.replace(/news_raw\.csv$/, 'news_analytics.csv');
      await appendToCsv(dedupedItems, analyticsPath);
      logger.info(`📊 分析團隊累加文件已更新：${analyticsPath} (+${dedupedItems.length} 條)`);
    } catch (e: any) {
      logger.error(`❌ Phase 5 AI 去重失敗: ${e.message}`);
      errors.push({ source: 'AIDedup', error: e.message });
      // AI 去重失敗不影響後續，使用原始 items 繼續
      dedupedItems = allItems;
    }
  } else if (!MINIMAX_API_KEY) {
    logger.info('\n⏭️ 跳過 AI 去重（MINIMAX_API_KEY 未設置）');
  }

  saveCheckpoint(batchId, 'aiDedup', {
    mode,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
    csvFilePath: config.csvFilePath,
  });

  // ============================================
  // Phase 6: Sync to Database
  // ============================================
  const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (POSTGRES_URL && allItems.length > 0) {
    logger.info('\n🗄️ ===== Phase 6: 同步到數據庫 =====');
    try {
      // 同步 AI 去重後的數據（如果 AI 去重成功），否則同步規則去重後的數據
      const syncResult = await syncNewsToDB(dedupedItems);
      logger.info(`✅ Phase 6 完成: 插入 ${syncResult.inserted}, 更新 ${syncResult.updated}, 跳過 ${syncResult.skipped}`);
    } catch (e: any) {
      logger.error(`❌ Phase 6 數據庫同步失敗: ${e.message}`);
      errors.push({ source: 'DBSync', error: e.message });
      // DB 同步失敗不會導致數據丟失，因為 Master CSV 已保存，可手動補同步
    }
    await closePool();
  } else if (!POSTGRES_URL) {
    logger.info('\n⏭️ 跳過 DB 同步（POSTGRES_URL 未設置）');
  }

  saveCheckpoint(batchId, 'dbSync', {
    mode,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
    csvFilePath: config.csvFilePath,
  });
  clearCheckpoint();

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
  logger.info(`   AI 去重後: ${dedupedItems.length} 條`);
  logger.info(`   錯誤: ${errors.length}`);
  if (errors.length > 0) {
    logger.info(`   錯誤詳情:`);
    errors.forEach(e => logger.info(`     - ${e.source}: ${e.error}`));
  }
}

/**
 * 從 checkpoint 恢復未完成的運行
 */
async function resumeFromCheckpoint(
  cp: Checkpoint,
  config: ReturnType<typeof getConfig>
): Promise<boolean> {

  const batchStartTime = new Date(cp.startedAt);

  // 如果已完成 DB 同步，視為已完成
  if (cp.completedPhase === 'dbSync' || cp.completedPhase === 'completed') {
    logger.info('✅ 上次運行已完成，清除 checkpoint');
    clearCheckpoint();
    return true;
  }

  // 嘗試從 Master CSV 中恢復本批次的新聞
  const recoveredItems = await readItemsFromCsvSince(cp.metadata.csvFilePath, batchStartTime);

  if (recoveredItems.length === 0) {
    logger.warn('⚠️ 無法從 CSV 恢復本批次新聞，可能 Master CSV 尚未寫入或為空');
    if (cp.completedPhase === 'fetch' || cp.completedPhase === 'dedup' || cp.completedPhase === 'fullContent') {
      // 這些階段 Master CSV 還未寫入，必須重新運行
      return false;
    }
    // writeMaster 之後應該有數據，如果沒有也重新運行
    return false;
  }

  logger.info(`🔁 恢復 ${recoveredItems.length} 條新聞，從 ${cp.completedPhase} 之後繼續`);

  let allItems = recoveredItems;
  let dedupedItems = allItems;

  // Phase 5: AI Dedup (如果之前未完成)
  const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';

  if (cp.completedPhase === 'writeMaster' || cp.completedPhase === 'fullContent' || cp.completedPhase === 'dedup' || cp.completedPhase === 'fetch') {
    if (MINIMAX_API_KEY && allItems.length > 0) {
      logger.info('\n🤖 ===== 恢復 Phase 5: AI 去重 =====');
      try {
        dedupedItems = await aiDedup(allItems);
        logger.info(`🤖 AI 去重：${allItems.length} → ${dedupedItems.length} (移除 ${allItems.length - dedupedItems.length} 條)`);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const dedupedPath = cp.metadata.csvFilePath.replace('.csv', `_deduped_${timestamp}.csv`);
        await appendToCsv(dedupedItems, dedupedPath);
        logger.info(`💾 本輪去重文件已保存：${dedupedPath}`);

        const analyticsPath = cp.metadata.csvFilePath.replace(/news_raw\.csv$/, 'news_analytics.csv');
        await appendToCsv(dedupedItems, analyticsPath);
        logger.info(`📊 分析團隊累加文件已更新：${analyticsPath} (+${dedupedItems.length} 條)`);
      } catch (e: any) {
        logger.error(`❌ AI 去重失敗: ${e.message}`);
        dedupedItems = allItems;
      }
    }

    saveCheckpoint(cp.batchId, 'aiDedup', cp.metadata);
  } else if (cp.completedPhase === 'aiDedup') {
    // 已經完成 AI 去重，使用恢復的 items 繼續
    logger.info('⏭️ AI 去重已完成，跳過 Phase 5');
    // dedupedItems 應該等於 allItems（因為 CSV 中保存的是去重前的，但 aiDedup 結果會生成獨立文件）
    // 這裡我們無法確切知道上次 AI 去重保留了哪些，所以用全部 items 進行 DB 同步
    // 這可能導致 DB 中有少量重複，但 ON CONFLICT 會處理
    dedupedItems = allItems;
  }

  // Phase 6: DB Sync
  const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (POSTGRES_URL && dedupedItems.length > 0) {
      logger.info('\n🗄️ ===== 恢復 Phase 6: 同步到數據庫 =====');
      try {
        const syncResult = await syncNewsToDB(dedupedItems);
        logger.info(`✅ DB 同步完成: 插入 ${syncResult.inserted}, 更新 ${syncResult.updated}, 跳過 ${syncResult.skipped}`);
      } catch (e: any) {
        logger.error(`❌ DB 同步失敗: ${e.message}`);
        await closePool();
        return false; // 讓外部知道 DB 同步仍然失敗
      }
      await closePool();
    } else if (!POSTGRES_URL) {
      logger.info('\n⏭️ 跳過 DB 同步（POSTGRES_URL 未設置）');
    }

  saveCheckpoint(cp.batchId, 'dbSync', cp.metadata);
  clearCheckpoint();
  logger.info('\n🎉 ===== 恢復運行完成 =====');
  return true;
}

// Run
main().catch(error => {
  console.error('❌ 執行失敗:', error);
  closePool().catch(() => {});
  process.exit(1);
});
