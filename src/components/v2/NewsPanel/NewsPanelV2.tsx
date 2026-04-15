import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { useInvestmentData } from '../../../hooks/useInvestmentData';
import { usePremiumStore } from '../../../store/usePremiumStore';
import { useDebugStore } from '../../../store/useDebugStore';
import { canViewNewsContent, getUserTier } from '../../../utils/permissions';
import { getNodeColor } from '../../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { NewsDrawer } from '../../NewsDrawer';
import type { NewsEvent } from '../../../types';
import './NewsPanelV2.css';

export const NewsPanelV2: React.FC = () => {
  const { news, switches, nodes } = useDataStore();
  const { loadMoreNews } = useInvestmentData();
  const { isPremium } = usePremiumStore();
  const { isDebugMode, mockPremium } = useDebugStore();
  const tier = getUserTier(isPremium, mockPremium);
  const canViewContent = canViewNewsContent(tier, isDebugMode);
  const contentVisible = canViewContent.allowed;
  const [drawerNews, setDrawerNews] = useState<NewsEvent | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  // 無限滾動監聽
  useEffect(() => {
    if (!listRef.current || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { root: listRef.current.parentElement, rootMargin: '100px' }
    );

    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    const more = await loadMoreNews();
    setHasMore(more);
    setIsLoadingMore(false);
  };

  // Debug: 記錄新聞數據
  if (isDebugMode && news) {
    console.log('📰 NewsPanelV2 - News data:', news.length, 'items');
    if (news.length > 0) {
      console.log('First news:', JSON.stringify(news[0], null, 2));
    }
  }

  const sortedNews = useMemo(() => {
    if (isDebugMode) {
      console.log('🔍 NewsPanelV2 - sorting news:', news?.length || 0, 'items');
    }
    if (!news || news.length === 0) return [];
    return [...news].sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      if (dateDiff !== 0) return dateDiff;
      const bTime = b.publishedTime || b.createdAt || '';
      const aTime = a.publishedTime || a.createdAt || '';
      return bTime.localeCompare(aTime);
    });
  }, [news]);

  const handleNewsClick = (news: NewsEvent) => {
    setDrawerNews(news);
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical': return { label: 'Critical Alert', color: '#ec4899', class: 'news-v2-critical' };
      case 'medium': return { label: 'Market Shift', color: '#f59e0b', class: 'news-v2-medium' };
      case 'positive': return { label: 'Growth Signal', color: '#10b981', class: 'news-v2-positive' };
      default: return { label: 'Update', color: '#a3a6ff', class: 'news-v2-info' };
    }
  };

  const getTimeAgo = (news: NewsEvent) => {
    // 優先使用 publishedTime（實際發布時間），其次是 createdAt
    if (news.publishedTime) {
      // publishedTime 格式為 "HH:MM"，需要結合 date 使用
      const timestamp = `${news.date}T${news.publishedTime}`;
      const past = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - past.getTime();
      const minutes = Math.floor(diff / 60000);
      
      if (minutes < 1) return '剛剛';
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return `${news.date} ${news.publishedTime}`;
    }
    
    // Fallback 到 createdAt
    const timestamp = news.createdAt || news.date;
    if (!timestamp) return '';
    
    const now = new Date();
    const past = new Date(timestamp);
    const diff = now.getTime() - past.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return news.date;
  };

  return (
    <>
      <div className="news-v2 glass-panel">
        <div className="news-v2-header">
          <div className="news-v2-header-left">
            <span className="material-symbols-outlined news-v2-icon">satellite_alt</span>
            <h3 className="news-v2-title">Macro Signals</h3>
          </div>
          <span className="news-v2-live-badge">LIVE</span>
        </div>

        <div className="news-v2-list" ref={listRef}>
          {isDebugMode && (
            <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem' }}>
              Debug: {sortedNews.length} news items rendered
            </div>
          )}
          
          <AnimatePresence>
            {sortedNews.map((news, index) => {
              const sevConfig = getSeverityConfig(news.severity);
              return (
                <motion.div
                  key={news.id || index}
                  className={`news-v2-card ${sevConfig.class} ${drawerNews === news ? 'selected' : ''}`}
                  onClick={() => handleNewsClick(news)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="news-v2-card-top">
                    <span className="news-v2-severity" style={{ color: sevConfig.color }}>{sevConfig.label}</span>
                    <span className="news-v2-time">{getTimeAgo(news)}</span>
                  </div>
                  <h4 className="news-v2-card-title">{news.title}</h4>
                  <p className={`news-v2-card-summary ${!contentVisible ? 'news-v2-blurred' : ''}`}>
                    {news.summary.substring(0, 80)}...
                  </p>
                  {news.affects && news.affects.length > 0 && (
                    <div className="news-v2-tags">
                      {news.affects.map((switchId: string) => {
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
                      點擊查看詳情
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {sortedNews.length === 0 && (
            <div className="news-v2-empty">暫無新聞</div>
          )}

          {/* 無限滾動加載更多 */}
          {hasMore && (
            <div className="news-v2-scroll-anchor" ref={listRef} />
          )}
        </div>

        {/* 加載更多按鈕 */}
        {hasMore && news && news.length > 0 && (
          <div className="news-v2-footer">
            <button
              className="news-v2-load-more-btn"
              onClick={async () => {
                setIsLoadingMore(true);
                const more = await loadMoreNews();
                setHasMore(more);
                setIsLoadingMore(false);
              }}
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
                  加載更多新聞
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <NewsDrawer news={drawerNews} onClose={() => setDrawerNews(null)} />
    </>
  );
};