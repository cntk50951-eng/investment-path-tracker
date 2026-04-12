// ==========================================
// 閾值框架組件（合規版本）
// ==========================================

import React from 'react';
import { useDataStore } from '../../store/useDataStore';
import { motion } from 'framer-motion';
import { getTier } from '../../utils/validators';
import { TIER_CONFIG } from '../../utils/constants';
import './ThresholdBanner.css';

export const ThresholdBanner: React.FC = () => {
  const { investmentData } = useDataStore();

  if (!investmentData?.thresholdAlert || !investmentData.switches) {
    return null;
  }

  const { switchId, progress, nextTrigger } = investmentData.thresholdAlert;
  const sw = investmentData.switches[switchId];
  if (!sw) return null;

  const fromNode = investmentData.nodes[sw.from];
  const toNode = investmentData.nodes[sw.to];
  const tier = getTier(progress);
  const tierConfig = TIER_CONFIG[tier];

  const markers = [
    { p: 35, l: '預警' },
    { p: 50, l: '初步確認' },
    { p: 75, l: '主線鎖定' },
  ];

  return (
    <motion.div
      className="threshold-banner"
      style={{ background: tierConfig.bg, borderColor: `${tierConfig.color}40` }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="banner-header">
        <div className="banner-title">
          <span style={{ color: tierConfig.color }}>{tierConfig.label}</span>
          <span className="banner-divider">—</span>
          <span>最高優先切換：</span>
          <span style={{ color: toNode.color }}>
            {fromNode.name.split(' ')[0]} → {toNode.name.split(' ')[0]}
          </span>
        </div>
        <div className="banner-progress" style={{ color: toNode.color, fontFamily: 'var(--font-mono)' }}>
          {Math.round(progress * 100)}%
        </div>
      </div>

      <div className="banner-progress-container">
        <div className="progress-markers">
          {markers.map(marker => (
            <div key={marker.p} className="marker" style={{ left: `${marker.p}%` }}>
              <div className="marker-line" />
              <div className="marker-label">{marker.l}</div>
            </div>
          ))}
        </div>
        <div className="progress-bar-bg">
          <motion.div
            className="progress-bar-fill"
            style={{ background: `linear-gradient(90deg, ${toNode.color}70, ${toNode.color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
      </div>

      <div className="banner-footer">
        <div className="banner-action" style={{ color: tierConfig.color }}>
          <span className="action-label">環境特徵：</span>
          <span className="action-text">{tierConfig.action}</span>
        </div>
        <div className="banner-trigger" title={nextTrigger}>{nextTrigger}</div>
      </div>
    </motion.div>
  );
};
