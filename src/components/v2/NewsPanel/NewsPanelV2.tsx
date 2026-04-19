import React, { useMemo, useState } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { useMarketStore } from '../../../store/useMarketStore';
import { usePremiumStore } from '../../../store/usePremiumStore';
import { useDebugStore } from '../../../store/useDebugStore';
import { canViewNewsContent, getUserTier } from '../../../utils/permissions';
import { getNodeColor } from '../../../utils/constants';
import { fetchNewsData } from '../../../hooks/useInvestmentData';
import type { NewsEvent } from '../../../types';
import './NewsPanelV2.css';

export const NewsPanelV2: React.FC = () => {
  const news = useDataStore(s => s.news);
  const switches = useDataStore(s => s.switches);
  const nodes = useDataStore(s => s.nodes);
  const currentMarket = useMarketStore(s => s.currentMarket);
  const { isPremium } = usePremiumStore();
  const { isDebugMode, mockPremium } = useDebugStore();
  const tier = getUserTier(isPremium, mockPremium);
  const canViewContent = canViewNewsContent(tier, isDebugMode);
  const contentVisible = canViewContent.allowed;
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sortedNews = useMemo(() => {
    if (!news || news.length === 0) return [];
    return [...news].sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      if (dateDiff !== 0) return dateDiff;
      const bTime = b.publishedTime || b.createdAt || '';
      const aTime = a.publishedTime || a.createdAt || '';
      return bTime.localeCompare(aTime);
    });
  }, [news]);

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const more = await fetchNewsData(currentMarket, true);
      setHasMore(more);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical': return { label: 'Critical', color: '#ec4899', className: 'news-v2-critical' };
      case 'medium': return { label: 'Shift', color: '#f59e0b', className: 'news-v2-medium' };
      case 'positive': return { label: 'Positive', color: '#10b981', className: 'news-v2-positive' };
      default: return { label: 'Info', color: '#a3a6ff', className: 'news-v2-info' };
    }
  };

  const getTimeAgo = (item: NewsEvent) => {
    if (item.publishedTime) {
      const timestamp = `${item.date}T${item.publishedTime}`;
      const past = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - past.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return '剛剛';
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d`;
      return `${item.date}`;
    }
    const timestamp = item.createdAt || item.date;
    if (!timestamp) return '';
    const now = new Date();
    const past = new Date(timestamp);
    const diff = now.getTime() - past.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return item.date;
  };

  return (
    <div className="news-v2 glass-panel">
      <div className="news-v2-header">
        <div className="news-v2-header-left">
          <span className="material-symbols-outlined news-v2-icon">satellite_alt</span>
          <h3 className="news-v2-title">新聞事件流</h3>
          <span className="news-v2-count">{sortedNews.length}</span>
        </div>
        <span className="news-v2-live-badge">LIVE</span>
      </div>

      <div className="news-v2-list">
        {sortedNews.map((item, index) => {
          const sevConfig = getSeverityConfig(item.severity);
          return (
            <div
              key={item.id || index}
              className={`news-v2-card ${sevConfig.className}`}
            >
              <div className="news-v2-card-top">
                <span className="news-v2-severity" style={{ color: sevConfig.color }}>{sevConfig.label}</span>
                <span className="news-v2-time">{getTimeAgo(item)}</span>
              </div>
              <h4 className="news-v2-card-title">{item.title}</h4>
              <p className={`news-v2-card-summary ${!contentVisible ? 'news-v2-blurred' : ''}`}>
                {item.summary}
              </p>
              {item.affects && item.affects.length > 0 && (
                <div className="news-v2-tags">
                  {item.affects.map((switchId: string) => {
                    const sw = switches?.[switchId];
                    const toNode = sw ? nodes?.[sw.to] : undefined;
                    const fromNode = sw ? nodes?.[sw.from] : undefined;
                    const color = toNode ? (toNode as any).color : getNodeColor(switchId);
                    const label = sw
                      ? `${(fromNode as any)?.name?.split(' ')[0] || sw.from}→${(toNode as any)?.name?.split(' ')[0] || sw.to}`
                      : switchId;
                    return (
                      <span key={switchId} className="news-v2-tag" style={{ background: `${color}18`, color }}>
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
              {!contentVisible && (
                <div className="news-v2-lock-hint">
                  <span className="material-symbols-outlined" style={{ fontSize: '0.75rem' }}>lock</span>
                  升級 Pro 查看完整內容
                </div>
              )}
            </div>
          );
        })}

        {sortedNews.length === 0 && (
          <div className="news-v2-empty">暫無新聞</div>
        )}
      </div>

      {hasMore && news && news.length > 0 && (
        <div className="news-v2-footer">
          <button
            className="news-v2-load-more-btn"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <span className="material-symbols-outlined news-v2-spin">progress_activity</span>
                加載中...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">expand_more</span>
                加載更多
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
