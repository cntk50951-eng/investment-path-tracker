// ==========================================
// 詳情面板組件
// ==========================================

import React from 'react';
import { useDataStore } from '../../store/useDataStore';
import { motion, AnimatePresence } from 'framer-motion';
import { calcProgress } from '../../utils/validators';
import './DetailPanel.css';

export const DetailPanel: React.FC = () => {
  const { selectedSwitch, selectedPath, selectedNews, investmentData } = useDataStore();

  if (!selectedSwitch && !selectedPath && !selectedNews) {
    return (
      <div className="detail-panel detail-panel-empty">
        <p className="empty-message">點擊切換或路徑查看詳情</p>
      </div>
    );
  }

  return (
    <div className="detail-panel">
      <AnimatePresence mode="wait">
        {selectedSwitch && investmentData?.switches[selectedSwitch] && (
          <SwitchDetail
            key="switch"
            switchId={selectedSwitch}
            data={investmentData.switches[selectedSwitch]}
            nodes={investmentData.nodes}
          />
        )}
        
        {selectedPath && investmentData?.nodes[selectedPath] && (
          <PathDetail
            key="path"
            pathId={selectedPath}
            node={investmentData.nodes[selectedPath]}
          />
        )}
        
        {selectedNews && (
          <NewsDetail
            key="news"
            news={selectedNews}
            switches={investmentData?.switches}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// 切換詳情子組件
interface SwitchDetailProps {
  switchId: string;
  data: any;
  nodes: any;
}

const SwitchDetail: React.FC<SwitchDetailProps> = ({ data, nodes }) => {
  const progress = calcProgress(data);
  const yesCount = data.confirms.filter((c: any) => c.status === 'yes').length;
  const nearCount = data.confirms.filter((c: any) => c.status === 'near').length;
  const noCount = data.confirms.filter((c: any) => c.status === 'no').length;

  return (
    <motion.div
      className="detail-content switch-detail"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3>
        ⚡ {nodes[data.from].name.split(' ')[0]} → {nodes[data.to].name.split(' ')[0]}
      </h3>

      {/* 進度摘要 */}
      <div className="progress-summary">
        <div className="progress-main">
          <div className="progress-value" style={{ color: nodes[data.to].color }}>
            {Math.round(progress * 100)}%
          </div>
          <div className="progress-label">確認進度</div>
          <div className="progress-count">
            ✅{yesCount} 🔶{nearCount} ❌{noCount} / 共{data.confirms.length}條
          </div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-bg">
            <motion.div
              className="progress-bar-fill"
              style={{ backgroundColor: nodes[data.to].color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="progress-markers">
            <span>35% 預警</span>
            <span>50% 確認</span>
            <span>75% 鎖定</span>
          </div>
        </div>
      </div>

      {/* 核心觸發 */}
      <div className="trigger-box" style={{ borderColor: `${nodes[data.to].color}40` }}>
        <div className="trigger-label">核心觸發條件</div>
        <div className="trigger-text">{data.trigger}</div>
      </div>

      {/* 確認信號清單 */}
      <div className="confirms-section">
        <div className="section-title">確認信號清單</div>
        <ul className="confirms-list">
          {data.confirms.map((confirm: any, idx: number) => (
            <li key={idx} className={`confirm-item ${confirm.status}`}>
              <span className="confirm-icon">
                {confirm.status === 'yes' ? '✅' : confirm.status === 'near' ? '🔶' : '❌'}
              </span>
              <div className="confirm-content">
                <div className="confirm-text">{confirm.text}</div>
                {confirm.actual && (
                  <div className="confirm-actual">{confirm.actual}</div>
                )}
                {confirm.note && (
                  <div className="confirm-note">{confirm.note}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 描述 */}
      {data.desc && (
        <div className="description-box">
          {data.desc}
        </div>
      )}

      {/* 下次檢查點 */}
      <div className="next-check">
        <span className="label">🗓 下次關鍵檢查點</span>
        <span className="value" style={{ color: nodes[data.to].color }}>
          {data.nextCheck}
        </span>
      </div>
    </motion.div>
  );
};

// 路徑詳情子組件
interface PathDetailProps {
  pathId: string;
  node: any;
}

const PathDetail: React.FC<PathDetailProps> = ({ node }) => {
  return (
    <motion.div
      className="detail-content path-detail"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3 style={{ color: node.color }}>📊 {node.name}</h3>
      
      <div className="path-subtitle">
        {node.sub} · 概率 <strong style={{ color: node.color }}>{node.prob}%</strong>
        {node.current && ' · ⭐ 當前基準路徑'}
      </div>

      {/* 板塊配置 */}
      <div className="allocation-section">
        <div className="section-title">板塊配置方向</div>
        <div className="allocation-list">
          {node.alloc.map((alloc: any, idx: number) => (
            <div key={idx} className="allocation-item">
              <span className="alloc-name">{alloc.n}</span>
              <div className="alloc-bar-bg">
                <div
                  className="alloc-bar-fill"
                  style={{ width: `${alloc.w * 2.5}%`, backgroundColor: alloc.c }}
                />
              </div>
              <span className="alloc-value" style={{ color: alloc.c }}>
                {alloc.w}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// 新聞詳情子組件
interface NewsDetailProps {
  news: any;
  switches?: any;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ news, switches }) => {
  return (
    <motion.div
      className="detail-content news-detail"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h3>📰 新聞影響分析</h3>

      <div className="news-title-large">{news.title}</div>
      <div className="news-meta">{news.date} · {news.source}</div>

      {/* 摘要 */}
      <div className="news-summary">{news.summary}</div>

      {/* 影響的路徑切換 */}
      {news.affects && news.affects.length > 0 && switches && (
        <>
          <div className="section-title">影響的路徑切換</div>
          <div className="affected-switches">
            {news.affects.map((switchId: string) => {
              const sw = switches[switchId];
              if (!sw) return null;
              return (
                <div key={switchId} className="affected-switch">
                  <div className="affected-label">
                    {sw.from.toUpperCase()} → {sw.to.toUpperCase()}
                  </div>
                  <div className="affected-desc">
                    確認進度：{Math.round(calcProgress(sw) * 100)}%
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
};
