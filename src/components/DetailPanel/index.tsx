// ==========================================
// 詳情面板組件
// ==========================================

import React from 'react';
import { useDataStore } from '../../store/useDataStore';
import { usePremiumStore } from '../../store/usePremiumStore';
import { useDebugStore } from '../../store/useDebugStore';
import { motion, AnimatePresence } from 'framer-motion';
import { calcProgress } from '../../utils/validators';
import { ALLOC_DISCLAIMER, TIER_COLORS } from '../../utils/complianceChecker';
import { canViewPathDetail, canViewSwitchDetail, getUserTier } from '../../utils/permissions';
import { TIER_CONFIG } from '../../utils/constants';
import { getTier } from '../../utils/validators';
import { BlurLock } from '../common/BlurLock';
import type { Node, Switch, Allocation } from '../../types';
import './DetailPanel.css';

export const DetailPanel: React.FC = () => {
  const { selectedSwitch, selectedPath, investmentData } = useDataStore();
  const { isPremium } = usePremiumStore();
  const { isDebugMode, mockPremium } = useDebugStore();
  const tier = getUserTier(isPremium, mockPremium);

  if (!selectedSwitch && !selectedPath) {
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
            data={investmentData.switches[selectedSwitch]}
            nodes={investmentData.nodes}
            tier={tier}
            isDebug={isDebugMode}
          />
        )}
        {selectedPath && investmentData?.nodes[selectedPath] && (
          <PathDetail
            key="path"
            node={investmentData.nodes[selectedPath]}
            tier={tier}
            isDebug={isDebugMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ---- 切換詳情 ----
const SwitchDetail: React.FC<{
  data: Switch;
  nodes: Record<string, Node>;
  tier: 'free' | 'pro';
  isDebug: boolean;
}> = ({ data, nodes, tier, isDebug }) => {
  const progress = calcProgress(data);
  const yesCount = data.confirms.filter(c => c.status === 'yes').length;
  const nearCount = data.confirms.filter(c => c.status === 'near').length;
  const noCount = data.confirms.filter(c => c.status === 'no').length;
  const tierKey = getTier(progress);
  const tierCfg = TIER_CONFIG[tierKey];
  const canDetail = canViewSwitchDetail(tier, isDebug);

  return (
    <motion.div
      className="detail-content switch-detail"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <h3>⚡ {nodes[data.from].name.split(' ')[0]} → {nodes[data.to].name.split(' ')[0]}</h3>

      {/* 進度摘要 — 免費可見 */}
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
            <span>35% 預警</span><span>50% 確認</span><span>75% 鎖定</span>
          </div>
        </div>
      </div>

      {/* 層級狀態 — 免費可見 */}
      <div className="tier-badge" style={{ background: tierCfg.bg, color: tierCfg.color }}>
        {tierCfg.label} — {tierCfg.action}
      </div>

      {/* 觸發條件 — 免費可見 */}
      <div className="trigger-box" style={{ borderColor: `${nodes[data.to].color}40` }}>
        <div className="trigger-label">核心觸發條件</div>
        <div className="trigger-text">{data.trigger}</div>
      </div>

      {/* 確認信號詳情 — Pro 專屬 */}
      <BlurLock
        unlocked={canDetail.allowed}
        reason={canDetail.reason}
        anchor="switch"
        blur="hard"
      >
        <div className="confirms-section">
          <div className="section-title">確認信號清單</div>
          <ul className="confirms-list">
            {data.confirms.map((confirm, idx) => (
              <li key={idx} className={`confirm-item ${confirm.status}`}>
                <span className="confirm-icon">
                  {confirm.status === 'yes' ? '✅' : confirm.status === 'near' ? '🔶' : '❌'}
                </span>
                <div className="confirm-content">
                  <div className="confirm-text">{confirm.text}</div>
                  {confirm.actual && <div className="confirm-actual">{confirm.actual}</div>}
                  {confirm.note && <div className="confirm-note">{confirm.note}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {data.desc && <div className="description-box">{data.desc}</div>}

        <div className="next-check">
          <span className="label">🗓 下次關鍵檢查點</span>
          <span className="value" style={{ color: nodes[data.to].color }}>{data.nextCheck}</span>
        </div>
      </BlurLock>
    </motion.div>
  );
};

// ---- 路徑詳情 ----
const PathDetail: React.FC<{
  node: Node;
  tier: 'free' | 'pro';
  isDebug: boolean;
}> = ({ node, tier, isDebug }) => {
  const canDetail = canViewPathDetail(!!node.current, tier, isDebug);

  return (
    <motion.div
      className="detail-content path-detail"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <h3 style={{ color: node.color }}>📊 {node.name}</h3>
      <div className="path-subtitle">
        {node.sub} · 概率 <strong style={{ color: node.color }}>{node.prob}%</strong>
        {node.current && ' · ⭐ 當前基準路徑'}
      </div>

      {/* 板塊特徵 */}
      <div className="allocation-section">
        <div className="alloc-disclaimer">{ALLOC_DISCLAIMER}</div>
        <BlurLock
          unlocked={canDetail.allowed}
          reason={canDetail.reason}
          anchor="path"
          blur="hard"
        >
          <AllocTierList alloc={node.alloc} />
        </BlurLock>
      </div>
    </motion.div>
  );
};

// ---- 合規板塊方向性渲染 ----
const AllocTierList: React.FC<{ alloc: Allocation[] }> = ({ alloc }) => (
  <div className="alloc-tier-list">
    {alloc.map((item, idx) => {
      const tierInfo = TIER_COLORS[item.tier] ?? TIER_COLORS.neutral;
      return (
        <div key={idx} className="alloc-tier-item">
          <span className="alloc-tier-name">{item.n}</span>
          <span
            className="alloc-tier-badge"
            style={{ background: tierInfo.bg, color: tierInfo.color, borderColor: `${tierInfo.color}30` }}
          >
            {tierInfo.label}
          </span>
        </div>
      );
    })}
  </div>
);
