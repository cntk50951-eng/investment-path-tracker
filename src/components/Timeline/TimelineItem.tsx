// ==========================================
// 時間軸新聞卡片組件
// ==========================================

import React from 'react';
import { motion } from 'framer-motion';
import { usePremiumStore } from '../../store/usePremiumStore';
import { useDebugStore } from '../../store/useDebugStore';
import { getNodeColor } from '../../utils/constants';
import { canViewNewsContent, getUserTier } from '../../utils/permissions';
import type { NewsEvent } from '../../types';
import './TimelineItem.css';

interface TimelineItemProps {
  news: NewsEvent;
  index: number;
  onClick: () => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ news, index, onClick }) => {
  const { isPremium } = usePremiumStore();
  const { isDebugMode, mockPremium } = useDebugStore();
  
  const tier = getUserTier(isPremium, mockPremium);
  const canView = canViewNewsContent(tier, isDebugMode);

  // 免費用戶僅可見前 10 條新聞
  const isFreeUser = !canView.allowed;
  const isVisible = !isFreeUser || index < 10;

  const severityColors = {
    critical: '#f472b6',
    medium: '#fbbf24',
    positive: '#4ade80',
  };

  if (!isVisible) {
    return null;
  }

  const isBlurred = isFreeUser && index >= 10;

  return (
    <motion.div
      className={`timeline-item ${news.severity}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div
        className={`timeline-card ${news.severity} ${isBlurred ? 'free-preview' : ''}`}
        onClick={onClick}
        style={{ '--severity-color': severityColors[news.severity] } as React.CSSProperties}
      >
        <div className="card-header">
          <span className="card-date">{news.date}</span>
          <span className="card-source">{news.source}</span>
        </div>

        <div className="card-content">
          <div className="card-title">{news.title}</div>
          
          {index < 10 && (
            <>
              <div className="card-summary">{news.summary}</div>
              
              {news.tags && news.tags.length > 0 && (
                <div className="card-tags">
                  {news.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="card-tag">{tag}</span>
                  ))}
                </div>
              )}
              
              {news.relatedPaths && news.relatedPaths.length > 0 && (
                <div className="card-paths">
                  {news.relatedPaths.map((pathId) => {
                    const color = getNodeColor(pathId);
                    return (
                      <div
                        key={pathId}
                        className="path-indicator"
                        style={{ '--path-color': color } as React.CSSProperties}
                      >
                        <span className="path-dot" />
                        {pathId.toUpperCase()}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <span className="click-hint">點擊查看詳情</span>
      </div>
    </motion.div>
  );
};
