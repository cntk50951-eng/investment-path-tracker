// ==========================================
// 新聞面板組件
// ==========================================

import React, { useMemo } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { usePremiumStore } from '../../store/usePremiumStore';
import { motion, AnimatePresence } from 'framer-motion';
import './NewsPanel.css';

export const NewsPanel: React.FC = () => {
  const { investmentData, selectNews, selectedNews } = useDataStore();
  const { isPremium } = usePremiumStore();

  // 排序新聞 (按日期降序)
  const sortedNews = useMemo(() => {
    if (!investmentData?.news) return [];
    return [...investmentData.news].sort((a, b) => b.date.localeCompare(a.date));
  }, [investmentData?.news]);

  const handleNewsClick = (news: typeof sortedNews[0]) => {
    selectNews(news === selectedNews ? null : news);
  };

  // 獲取嚴重性顏色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#f472b6';
      case 'medium':
        return '#fbbf24';
      case 'positive':
        return '#4ade80';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="news-panel" id="newsPanel">
      <div className="news-header">
        <span>📰 新聞事件流</span>
        <span className="news-count">{sortedNews.length} 條</span>
      </div>

      <div className="news-list">
        <AnimatePresence>
          {sortedNews.map((news, index) => {
            const severityColor = getSeverityColor(news.severity);
            const isFree = !isPremium && index >= 3; // 前 3 條免費

            return (
              <motion.div
                key={news.id || index}
                className={`news-item ${selectedNews === news ? 'selected' : ''} ${isFree ? 'locked' : ''}`}
                style={{ borderLeftColor: severityColor }}
                onClick={() => !isFree && handleNewsClick(news)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15, delay: index * 0.05 }}
                whileHover={!isFree ? { scale: 1.02, backgroundColor: 'rgba(30,41,59,0.75)' } : {}}
              >
                {/* 日期和來源 */}
                <div className="news-date">{news.date} · {news.source}</div>

                {/* 標題 */}
                <div className="news-title">
                  {news.title}
                </div>

                {/* 影響路徑標籤 */}
                {news.affects && news.affects.length > 0 && (
                  <div className="news-tags">
                    {news.affects.map(switchId => {
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

                {/* 免費用戶鎖定 */}
                {isFree && (
                  <div className="news-lock-overlay">
                    🔒 Pro
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
  );
};

// 輔助函數：獲取節點顏色
function getNodeColor(nodeId?: string | null): string {
  if (!nodeId) return '#94a3b8';
  const colors: Record<string, string> = {
    a: '#4ade80',
    b: '#fbbf24',
    c: '#f87171',
    d: '#a78bfa',
    e: '#f472b6',
  };
  return colors[nodeId] || '#94a3b8';
}
