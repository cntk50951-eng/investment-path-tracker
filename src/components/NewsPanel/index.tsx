// ==========================================
// 新聞面板組件（含權限控制）
// ==========================================

import React, { useMemo, useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { usePremiumStore } from '../../store/usePremiumStore';
import { useDebugStore } from '../../store/useDebugStore';
import { canViewNewsContent, getUserTier } from '../../utils/permissions';
import { getNodeColor } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { NewsDrawer } from '../NewsDrawer';
import type { NewsEvent } from '../../types';
import './NewsPanel.css';

export const NewsPanel: React.FC = () => {
  const { news } = useDataStore();
  const { isPremium } = usePremiumStore();
  const { isDebugMode, mockPremium } = useDebugStore();
  const tier = getUserTier(isPremium, mockPremium);
  const canViewContent = canViewNewsContent(tier, isDebugMode);
  const contentVisible = canViewContent.allowed;

  const [drawerNews, setDrawerNews] = useState<NewsEvent | null>(null);

  const sortedNews = useMemo(() => {
    if (!news) return [];
    return [...news].sort((a, b) => b.date.localeCompare(a.date));
  }, [news]);

  const handleNewsClick = (news: NewsEvent) => {
    setDrawerNews(news);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#f472b6';
      case 'medium': return '#fbbf24';
      case 'positive': return '#4ade80';
      default: return '#94a3b8';
    }
  };

  return (
    <>
      <div className="news-panel" id="newsPanel">
        <div className="news-header">
          <span>📰 新聞事件流</span>
          <span className="news-count">{sortedNews.length} 條</span>
        </div>

        <div className="news-list">
          <AnimatePresence>
            {sortedNews.map((news, index) => {
              const severityColor = getSeverityColor(news.severity);

              return (
                <motion.div
                  key={news.id || index}
                  className={`news-item ${drawerNews === news ? 'selected' : ''}`}
                  style={{ borderLeftColor: severityColor }}
                  onClick={() => handleNewsClick(news)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(30,41,59,0.75)' }}
                >
                  {/* 日期和來源（始終可見） */}
                  <div className="news-date">{news.date} · {news.source}</div>

                  {/* 標題（始終可見） */}
                  <div className="news-title">{news.title}</div>

                  {/* 摘要預覽 */}
                  {contentVisible ? (
                    <div className="news-preview">{news.summary.substring(0, 60)}...</div>
                  ) : (
                    <div className="news-preview news-blurred">
                      {news.summary.substring(0, 60)}...
                    </div>
                  )}

                  {/* 影響路徑標籤 */}
                  {news.affects && news.affects.length > 0 && (
                    <div className="news-tags">
                      {news.affects.map((switchId: string) => {
                        const toNode = switchId.split('').pop();
                        const color = getNodeColor(toNode);
                        return (
                          <span
                            key={switchId}
                            className="tag"
                            style={{ background: `${color}18`, color }}
                          >
                            {switchId.toUpperCase()}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* 非 Pro 用戶的鎖定提示 */}
                  {!contentVisible && (
                    <div className="news-lock-hint">
                      <span className="lock-icon">🔒</span> 點擊查看詳情
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {sortedNews.length === 0 && (
            <div className="no-news">暫無新聞</div>
          )}
        </div>
      </div>

      {/* 新聞詳情抽屜 */}
      <NewsDrawer
        news={drawerNews}
        onClose={() => setDrawerNews(null)}
      />
    </>
  );
};
