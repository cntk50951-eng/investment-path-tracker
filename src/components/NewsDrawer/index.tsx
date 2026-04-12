// ==========================================
// 新聞詳情抽屜組件
// ==========================================

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataStore } from '../../store/useDataStore';
import { usePremiumStore } from '../../store/usePremiumStore';
import { useDebugStore } from '../../store/useDebugStore';
import { canViewNewsDetail, getUserTier } from '../../utils/permissions';
import { calcProgress } from '../../utils/validators';
import { getNodeColor } from '../../utils/constants';
import type { NewsEvent } from '../../types';
import './NewsDrawer.css';

interface NewsDrawerProps {
  news: NewsEvent | null;
  onClose: () => void;
}

export const NewsDrawer: React.FC<NewsDrawerProps> = ({ news, onClose }) => {
  const { investmentData } = useDataStore();
  const { isPremium } = usePremiumStore();
  const { isDebugMode, mockPremium } = useDebugStore();
  const tier = getUserTier(isPremium, mockPremium);
  const canView = canViewNewsDetail(tier, isDebugMode);

  // ESC 關閉
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {news && (
        <>
          <motion.div
            className="news-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="news-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="drawer-header">
              <h3>📰 新聞詳情</h3>
              <button className="drawer-close" onClick={onClose}>✕</button>
            </div>

            <div className="drawer-body">
              {/* 嚴重性標籤 */}
              <span className={`drawer-severity ${news.severity}`}>
                {news.severity === 'critical' ? '🔴 關鍵' : news.severity === 'medium' ? '🟡 中等' : '🟢 正面'}
              </span>

              {/* 標題 */}
              <div className="drawer-title">{news.title}</div>

              {/* 元信息 */}
              <div className="drawer-meta">{news.date} · {news.source}</div>

              {/* 摘要（始終可見） */}
              <div className="drawer-section">
                <div className="drawer-section-title">摘要</div>
                <div className="drawer-summary">{news.summary}</div>
              </div>

              {/* 以下為付費內容 */}
              {canView.allowed ? (
                <>
                  {/* 影響分析 */}
                  {news.impact && (
                    <div className="drawer-section">
                      <div className="drawer-section-title">影響分析</div>
                      <div className="drawer-impact">{news.impact}</div>
                    </div>
                  )}

                  {/* 標籤 */}
                  {news.tags && news.tags.length > 0 && (
                    <div className="drawer-section">
                      <div className="drawer-section-title">相關標籤</div>
                      <div className="drawer-tags">
                        {news.tags.map(tag => (
                          <span key={tag} className="drawer-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 關聯投資路徑 */}
                  {news.relatedPaths && news.relatedPaths.length > 0 && investmentData && (
                    <div className="drawer-section">
                      <div className="drawer-section-title">關聯投資路徑</div>
                      <div className="drawer-paths">
                        {news.relatedPaths.map(pathId => {
                          const node = investmentData.nodes[pathId];
                          if (!node) return null;
                          return (
                            <div key={pathId} className="drawer-path-item">
                              <span className="drawer-path-dot" style={{ background: node.color }} />
                              <span style={{ color: node.color, fontWeight: 600 }}>{node.name}</span>
                              <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>{node.prob}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 影響的路徑切換 */}
                  {news.affects && news.affects.length > 0 && investmentData?.switches && (
                    <div className="drawer-section">
                      <div className="drawer-section-title">影響的路徑切換</div>
                      <div className="drawer-affected">
                        {news.affects.map(switchId => {
                          const sw = investmentData.switches[switchId];
                          if (!sw) return null;
                          const progress = calcProgress(sw);
                          const toColor = getNodeColor(sw.to);
                          return (
                            <div key={switchId} className="drawer-affected-item">
                              <div className="drawer-affected-label" style={{ color: toColor }}>
                                {sw.from.toUpperCase()} → {sw.to.toUpperCase()}
                              </div>
                              <div className="drawer-affected-progress">
                                確認進度：{Math.round(progress * 100)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* 鎖定狀態 */
                <div className="drawer-locked">
                  <div className="drawer-locked-content">
                    <div className="drawer-section">
                      <div className="drawer-section-title">影響分析</div>
                      <div className="drawer-impact">此內容需要 Pro 會員才能查看完整分析...</div>
                    </div>
                    <div className="drawer-section">
                      <div className="drawer-section-title">相關標籤</div>
                      <div className="drawer-tags">
                        <span className="drawer-tag">標籤1</span>
                        <span className="drawer-tag">標籤2</span>
                      </div>
                    </div>
                  </div>
                  <div className="drawer-locked-overlay">
                    <span style={{ fontSize: '1.5em' }}>🔒</span>
                    <span style={{ color: '#f472b6', fontWeight: 700, fontSize: '0.9em' }}>Pro 會員專屬</span>
                    <button className="drawer-upgrade-btn">升級 Pro 解鎖</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
