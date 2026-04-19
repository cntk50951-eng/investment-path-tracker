// ==========================================
// 新聞時間線頁面
// ==========================================

import React, { useMemo, useState } from 'react';
import { useInitialDataFetch } from '../hooks/useInvestmentData';
import { useDataStore } from '../store/useDataStore';
import { useMarketStore } from '../store/useMarketStore';
import { FunctionTab } from '../components/FunctionTab';
import { MarketTab } from '../components/MarketTab';
import { TimelineFilter } from '../components/TimelineFilter';
import { TimelineItem } from '../components/Timeline/TimelineItem';
import { NewsDrawer } from '../components/NewsDrawer';
import { PaywallModal } from '../components/common/PaywallModal';
import { NewsChat } from '../components/NewsChat/NewsChat';
import type { NewsEvent } from '../types';
import './NewsTimeline.css';

const NewsTimeline: React.FC = () => {
  useInitialDataFetch();
  const news = useDataStore(s => s.news);
  const loadingModules = useDataStore(s => s.loadingModules);
  const error = useDataStore(s => s.error);
  const { currentMarket } = useMarketStore();

  const [selectedNews, setSelectedNews] = useState<NewsEvent | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [filter, setFilter] = useState<{
    severity?: 'critical' | 'medium' | 'positive';
    path?: string;
    tag?: string;
    timeRange?: '7d' | '30d' | '90d' | 'all';
  }>({});

  // 過濾新聞
  const filteredNews = useMemo(() => {
    if (!news) return [];

    let filtered = [...news];

    // 按市場過濾
    if (currentMarket === 'HK') {
      filtered = filtered.filter(n => n.market === 'HK');
    } else {
      filtered = filtered.filter(n => !n.market || n.market === 'US');
    }

    // 按嚴重性過濾
    if (filter.severity) {
      filtered = filtered.filter(n => n.severity === filter.severity);
    }

    // 按路徑過濾
    if (filter.path) {
      filtered = filtered.filter(n => n.relatedPaths?.includes(filter.path!));
    }

    // 按標籤過濾
    if (filter.tag) {
      filtered = filtered.filter(n => n.tags?.includes(filter.tag!));
    }

    // 按時間範圍過濾
    if (filter.timeRange && filter.timeRange !== 'all') {
      const now = new Date();
      const days = filter.timeRange === '7d' ? 7 : filter.timeRange === '30d' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(n => new Date(n.date) >= cutoff);
    }

    // 排序（最新優先，同天按精確時間降序）
    return filtered.sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      if (dateDiff !== 0) return dateDiff;
      const bTime = (b as any).createdAt || '';
      const aTime = (a as any).createdAt || '';
      return bTime.localeCompare(aTime);
    });
  }, [news, currentMarket, filter]);

  // 提取所有唯一標籤
  const allTags = useMemo(() => {
    if (!news) return [];
    const tags = new Set<string>();
    news.forEach((n: any) => n.tags?.forEach((tag: any) => tags.add(tag)));
    return Array.from(tags);
  }, [news]);

  if (loadingModules.news) {
    return (
      <div className="news-timeline-page">
        <MarketTab />
        <FunctionTab />
        <div className="news-timeline-loading">
          <div className="spinner" />
          <p>加載新聞時間線...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-timeline-page">
        <MarketTab />
        <FunctionTab />
        <div className="news-timeline-error">
          <h3>⚠️ 加載失敗</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>重新加載</button>
        </div>
      </div>
    );
  }

  return (
    <div className="news-timeline-page">
      <header className="news-timeline-header">
        <MarketTab />
        <FunctionTab />
      </header>

      <main className="news-timeline-main">
        {/* 篩選器 */}
        <TimelineFilter
          filter={filter}
          onFilterChange={setFilter}
          availableTags={allTags}
        />

        {/* 時間軸 */}
        <div className="news-timeline">
          <div className="timeline-header">
            <h2>📰 新聞事件流</h2>
            <span className="news-count">{filteredNews.length} 條</span>
          </div>

          <div className="timeline-container">
            {filteredNews.length > 0 ? (
              filteredNews.map((news, index) => (
                <TimelineItem
                  key={news.id || index}
                  news={news}
                  index={index}
                  onClick={() => setSelectedNews(news)}
                />
              ))
            ) : (
              <div className="no-news">
                <span className="no-news-icon">📭</span>
                <p>暫無符合條件的新聞</p>
                <button
                  className="clear-filters-btn"
                  onClick={() => setFilter({})}
                >
                  清除篩選條件
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 新聞詳情抽屜 */}
      <NewsDrawer
        news={selectedNews}
        onClose={() => setSelectedNews(null)}
      />

      {/* 付費牆模態框 */}
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />

      {/* AI 新聞助手 */}
      <NewsChat />
    </div>
  );
};

export default NewsTimeline;
