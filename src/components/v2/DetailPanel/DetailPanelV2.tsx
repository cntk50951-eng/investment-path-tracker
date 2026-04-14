import React from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { usePremiumStore } from '../../../store/usePremiumStore';
import { useDebugStore } from '../../../store/useDebugStore';
import { motion, AnimatePresence } from 'framer-motion';
import { calcProgress } from '../../../utils/validators';
import { ALLOC_DISCLAIMER, TIER_COLORS } from '../../../utils/complianceChecker';
import { canViewPathDetail, canViewSwitchDetail, getUserTier } from '../../../utils/permissions';
import { TIER_CONFIG } from '../../../utils/constants';
import { getTier } from '../../../utils/validators';
import { BlurLock } from '../../common/BlurLock';
import type { Node, Switch, Allocation } from '../../../types';
import './DetailPanelV2.css';

export const DetailPanelV2: React.FC = () => {
  const { selectedSwitch, selectedPath, nodes, switches } = useDataStore();
  const { isPremium } = usePremiumStore();
  const { isDebugMode, mockPremium } = useDebugStore();
  const tier = getUserTier(isPremium, mockPremium);

  if (!selectedSwitch && !selectedPath) {
    return (
      <section className="detail-v2 glass-panel">
        <div className="detail-v2-empty">
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', opacity: 0.3 }}>touch_app</span>
          <p>點擊切換或路徑查看詳情</p>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-v2 glass-panel">
      <AnimatePresence mode="wait">
        {selectedSwitch && switches && switches[selectedSwitch] && (
          <SwitchDetailV2
            key="switch"
            data={switches[selectedSwitch]!}
            nodes={nodes || {}}
            tier={tier}
            isDebug={isDebugMode}
          />
        )}
        {selectedPath && nodes && nodes[selectedPath] && (
          <PathDetailV2
            key="path"
            node={nodes[selectedPath]!}
            tier={tier}
            isDebug={isDebugMode}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

const SwitchDetailV2: React.FC<{
  data: Switch;
  nodes: Record<string, Node>;
  tier: 'free' | 'pro';
  isDebug: boolean;
}> = ({ data, nodes, tier, isDebug }) => {
  const progress = calcProgress(data);
  const tierKey = getTier(progress);
  const tierCfg = TIER_CONFIG[tierKey];
  const canDetail = canViewSwitchDetail(tier, isDebug);

  return (
    <motion.div
      className="detail-v2-content"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <h3 className="detail-v2-title">
        ⚡ {nodes[data.from].name.split(' ')[0]} → {nodes[data.to].name.split(' ')[0]}
      </h3>

      <div className="detail-v2-progress">
        <div className="detail-v2-progress-main">
          <div className="detail-v2-progress-value" style={{ color: nodes[data.to].color }}>
            {Math.round(progress * 100)}%
          </div>
          <div className="detail-v2-progress-label">確認進度</div>
        </div>
        <div className="detail-v2-progress-bar-container">
          <div className="detail-v2-progress-bar-bg">
            <motion.div
              className="detail-v2-progress-bar-fill"
              style={{ backgroundColor: nodes[data.to].color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="detail-v2-progress-markers">
            <span>35% 預警</span><span>50% 確認</span><span>75% 鎖定</span>
          </div>
        </div>
      </div>

      <div className="detail-v2-tier" style={{ background: tierCfg.bg, color: tierCfg.color }}>
        {tierCfg.label} — {tierCfg.action}
      </div>

      <div className="detail-v2-trigger" style={{ borderColor: `${nodes[data.to].color}40` }}>
        <div className="detail-v2-trigger-label">核心觸發條件</div>
        <div className="detail-v2-trigger-text">{data.trigger}</div>
      </div>

      <BlurLock unlocked={canDetail.allowed} reason={canDetail.reason} anchor="switch" blur="hard">
        <div className="detail-v2-confirms">
          <div className="detail-v2-section-title">確認信號清單</div>
          <ul className="detail-v2-confirms-list">
            {data.confirms.map((confirm, idx) => (
              <li key={idx} className={`detail-v2-confirm-item ${confirm.status}`}>
                <span className="detail-v2-confirm-icon">
                  {confirm.status === 'yes' ? '✅' : confirm.status === 'near' ? '🔶' : '❌'}
                </span>
                <div className="detail-v2-confirm-content">
                  <div className="detail-v2-confirm-text">{confirm.text}</div>
                  {confirm.actual && <div className="detail-v2-confirm-actual">{confirm.actual}</div>}
                  {confirm.note && <div className="detail-v2-confirm-note">{confirm.note}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {data.desc && <div className="detail-v2-desc">{data.desc}</div>}

        <div className="detail-v2-next-check">
          <span className="detail-v2-next-label">🗓 下次關鍵檢查點</span>
          <span className="detail-v2-next-value" style={{ color: nodes[data.to].color }}>{data.nextCheck}</span>
        </div>
      </BlurLock>
    </motion.div>
  );
};

const PathDetailV2: React.FC<{
  node: Node;
  tier: 'free' | 'pro';
  isDebug: boolean;
}> = ({ node, tier, isDebug }) => {
  const canDetail = canViewPathDetail(!!node.current, tier, isDebug);

  return (
    <motion.div
      className="detail-v2-content"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <h3 className="detail-v2-title" style={{ color: node.color }}>📊 {node.name}</h3>
      <div className="detail-v2-path-subtitle">
        {node.sub} · 概率 <strong style={{ color: node.color }}>{node.prob}%</strong>
        {node.current && ' · ⭐ 當前基準路徑'}
      </div>

      <div className="detail-v2-alloc-section">
        <div className="detail-v2-alloc-disclaimer">{ALLOC_DISCLAIMER}</div>
        <BlurLock unlocked={canDetail.allowed} reason={canDetail.reason} anchor="path" blur="hard">
          <AllocTierListV2 alloc={node.alloc} />
        </BlurLock>
      </div>
    </motion.div>
  );
};

const AllocTierListV2: React.FC<{ alloc: Allocation[] }> = ({ alloc }) => (
  <div className="detail-v2-alloc-list">
    {alloc.map((item, idx) => {
      const tierInfo = TIER_COLORS[item.tier] ?? TIER_COLORS.neutral;
      return (
        <div key={idx} className="detail-v2-alloc-item">
          <span className="detail-v2-alloc-name">{item.n}</span>
          <span
            className="detail-v2-alloc-badge"
            style={{ background: tierInfo.bg, color: tierInfo.color, borderColor: `${tierInfo.color}30` }}
          >
            {tierInfo.label}
          </span>
        </div>
      );
    })}
  </div>
);