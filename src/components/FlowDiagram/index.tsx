// ==========================================
// SVG 流程圖組件（含權限控制 + 路徑 Tab 切換）
// Free 用戶：基準路徑 + 最高概率路徑可見，其他路徑以 BlurLock 風格模糊
// ==========================================

import React, { useMemo, useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { usePremiumStore } from '../../store/usePremiumStore';
import { useDebugStore } from '../../store/useDebugStore';
import { motion, AnimatePresence } from 'framer-motion';
import { calcProgress } from '../../utils/validators';
import { canViewPathDetail, getUserTier } from '../../utils/permissions';
import './FlowDiagram.css';

const DEFAULT_PATH_COLORS: Record<string, string> = {
  a: '#4ade80', b: '#fbbf24', c: '#f87171', d: '#a78bfa', e: '#f472b6',
};

export const FlowDiagram: React.FC = () => {
  const { nodes, switches, selectSwitch, selectPath, selectedSwitch, selectedPath } = useDataStore();
  const { isPremium, showUpgradePrompt } = usePremiumStore();
  const { isDebugMode, mockPremium, showBlurDebug } = useDebugStore();
  const tier = getUserTier(isPremium, mockPremium);
  const [hoveredLocked, setHoveredLocked] = useState<string | null>(null);

  const nodeIds = useMemo(() => {
    if (!nodes) return [];
    return Object.keys(nodes).sort();
  }, [nodes]);

  const nodeColors = useMemo(() => {
    if (!nodes) return DEFAULT_PATH_COLORS;
    const colors: Record<string, string> = {};
    for (const [id, node] of Object.entries(nodes)) {
      colors[id] = (node as any).color || DEFAULT_PATH_COLORS[id.replace('hk', '')] || '#94a3b8';
    }
    return colors;
  }, [nodes]);

  // Free 用戶可見路徑：基準路徑 + 最高概率路徑
  const visibleForFree = useMemo(() => {
    const set = new Set<string>();
    if (!nodes) return set;
    let maxProb = -1;
    let maxProbId = '';
    for (const [id, n] of Object.entries(nodes)) {
      if ((n as any).current) set.add(id);
      const prob = (n as any).prob ?? 0;
      if (prob > maxProb) { maxProb = prob; maxProbId = id; }
    }
    if (maxProbId) set.add(maxProbId);
    return set;
  }, [nodes]);

  const handleSwitchClick = (switchId: string) => {
    selectSwitch(switchId === selectedSwitch ? null : switchId);
  };

  const handleNodeClick = (nodeId: string) => {
    const node = nodes?.[nodeId];
    if (!node) return;
    const n = node as any;
    const isVisible = visibleForFree.has(nodeId);
    const perm = canViewPathDetail(!!n.current, tier, isDebugMode, isVisible && !n.current);
    if (!perm.allowed) {
      showUpgradePrompt(perm.reason, 'path');
    }
    selectPath(nodeId === selectedPath ? null : nodeId);
  };

  if (!switches || !nodes) {
    return <div className="flow-diagram-loading">加載流程圖...</div>;
  }
  const sortedSwitches = Object.entries(switches).sort(
    (a, b) => calcProgress(a[1]) - calcProgress(b[1])
  );

  return (
    <div className="flow-diagram">
      {/* 路徑 Tab 切換欄 */}
      <div className="path-tabs">
        {nodeIds.map(id => {
          const node = nodes[id];
          if (!node) return null;
          const n = node as any;
          const isActive = selectedPath === id;
          const isCurrent = !!n.current;
          const color = n.color || nodeColors[id];
          const isFreeVisible = visibleForFree.has(id);
          const isLocked = !isFreeVisible && !isCurrent;
          const perm = canViewPathDetail(isCurrent, tier, isDebugMode, isFreeVisible && !isCurrent);

          return (
            <motion.button
              key={id}
              className={`path-tab ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${!perm.allowed ? 'locked' : ''}`}
              style={{
                borderColor: isActive ? color : 'transparent',
                color: color,
              }}
              onClick={() => handleNodeClick(id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="tab-name">
                {isLocked ? '•••' : (n.name?.split(' ')[0] || id.toUpperCase())}
              </span>
              <span className="tab-prob" style={{ fontFamily: 'var(--font-mono)' }}>{n.prob ?? 0}%</span>
              {!perm.allowed && <span className="tab-lock">🔒</span>}
              {isCurrent && <span className="tab-current">⭐</span>}
            </motion.button>
          );
        })}
      </div>

      <div className="flow-diagram-viewport">
        <svg viewBox="0 0 800 430" className="flow-svg">
          <defs>
            {nodeIds.map(id => {
              const color = nodeColors[id];
              return (
                <marker key={id} id={`arrowhead-${id}`} markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                  <polygon points="0 0,7 2.5,0 5" fill={color} />
                </marker>
              );
            })}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowHighProb" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" result="coloredBlur" />
              <feFlood floodColor="#f472b6" floodOpacity="0.25" result="glowColor" />
              <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
              <feMerge><feMergeNode in="softGlow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g id="arrowLayer">
            {sortedSwitches.map(([switchId, sw]) => {
              const progress = calcProgress(sw);
              const toId = sw.to;
              const fromId = sw.from;
              const toColor = nodeColors[toId] || '#94a3b8';
              const fromNode = nodes[fromId];
              const isCurrentPath = fromNode ? !!(fromNode as any).current : false;
              // 箭頭可見性：起點或終點可見時，箭頭部分可見
              const isArrowVisible = visibleForFree.has(fromId) || visibleForFree.has(toId);
              const isArrowFullyVisible = visibleForFree.has(fromId) && visibleForFree.has(toId);

              if (!isArrowVisible) return null;

              return (
                <g key={switchId} onClick={() => handleSwitchClick(switchId)} style={{ cursor: 'pointer' }}>
                  <path d={sw.path} fill="none" stroke="transparent" strokeWidth="26" />
                  <motion.path
                    d={sw.path}
                    fill="none"
                    stroke={toColor}
                    strokeWidth={1.2 + progress * 5}
                    markerEnd={`url(#arrowhead-${toId})`}
                    opacity={isArrowFullyVisible ? 0.12 + progress * 0.88 : 0.25}
                    strokeDasharray={isCurrentPath ? '12,5' : '7,4'}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                  />
                  {isCurrentPath && progress > 0.2 && isArrowFullyVisible && (
                    <motion.path
                      d={sw.path}
                      fill="none"
                      stroke={toColor}
                      strokeWidth={1.2 + progress * 5}
                      strokeDasharray="12,5"
                      opacity={0.6}
                      initial={{ pathOffset: 0 }}
                      animate={{ pathOffset: 17 }}
                      transition={{ duration: Math.max(0.5, 1.8 - progress * 1.5), repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </g>
              );
            })}
          </g>

          <g id="nodeLayer">
            {nodeIds.map(id => {
              const node = nodes[id];
              if (!node) return null;
              const n = node as any;
              const color = n.color || nodeColors[id];
              const x = n.x ?? 400;
              const y = n.y ?? 215;
              const name = n.name || id.toUpperCase();
              const prob = n.prob ?? 0;
              const isCurrent = !!n.current;
              const isHighestProb = prob >= 30;
              const isFreeVisible = visibleForFree.has(id);
              const isLocked = !isFreeVisible && !isCurrent;

              if (isLocked) {
                // 模糊節點：用模糊的色塊代替文字
                return (
                  <g key={id} onClick={() => handleNodeClick(id)} style={{ cursor: 'pointer' }} className="flow-node flow-node-locked">
                    <rect
                      x={x - 54} y={y - 24}
                      width={108} height={48}
                      rx={11}
                      fill={`${color}08`}
                      stroke={color}
                      strokeWidth={1}
                      strokeDasharray="4,4"
                      opacity={0.3}
                    />
                    <text x={x} y={y - 5} textAnchor="middle" fill={color} fontSize={10} fontWeight="600" opacity={0.25}>
                      🔒
                    </text>
                    <text x={x} y={y + 14} textAnchor="middle" fill={color} fontSize={14} fontWeight="700" fontFamily="var(--font-mono)" opacity={0.25}>
                      {prob}%
                    </text>
                  </g>
                );
              }

              return (
                <g key={id} onClick={() => handleNodeClick(id)} style={{ cursor: 'pointer' }} className="flow-node">
                  {isCurrent && (
                    <motion.circle
                      cx={x} cy={y} r={52}
                      fill="none" stroke={color} strokeWidth={1.5}
                      initial={{ opacity: 0.12, scale: 1 }}
                      animate={{ opacity: [0.12, 0.45, 0.12], scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <motion.rect
                    x={x - (isHighestProb ? 128 : 108) / 2}
                    y={y - 24}
                    width={isHighestProb ? 128 : 108}
                    height={48}
                    rx={11}
                    fill={`${color}18`}
                    stroke={color}
                    strokeWidth={isCurrent ? 2.5 : selectedPath === id ? 2 : 1.5}
                    filter={isHighestProb ? 'url(#glowHighProb)' : isCurrent ? 'url(#glow)' : undefined}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  />
                  <text x={x} y={y - 5} textAnchor="middle" fill={color} fontSize={10.5} fontWeight="700">
                    {name}
                  </text>
                  {prob !== undefined && (
                    <text x={x} y={y + 14} textAnchor="middle" fill={color} fontSize={16} fontWeight="800" fontFamily="var(--font-mono)">
                      {prob}%
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* BlurLock 風格遮罩層 - 覆蓋在被鎖定節點上 */}
        {nodeIds.map(id => {
          const node = nodes[id];
          if (!node) return null;
          const n = node as any;
          const isFreeVisible = visibleForFree.has(id);
          const isCurrent = !!n.current;
          const isLocked = !isFreeVisible && !isCurrent;
          if (!isLocked) return null;

          const x = n.x ?? 400;
          const y = n.y ?? 215;
          const color = n.color || nodeColors[id];
          // SVG viewBox 是 800x430，轉換為百分比定位
          const leftPct = (x / 800) * 100;
          const topPct = (y / 430) * 100;

          return (
            <div
              key={`lock-${id}`}
              className="flow-node-lock-overlay"
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              onMouseEnter={() => setHoveredLocked(id)}
              onMouseLeave={() => setHoveredLocked(null)}
              onClick={() => showUpgradePrompt('升級 Pro 解鎖全部路徑的板塊特徵', 'path')}
            >
              <AnimatePresence>
                {hoveredLocked === id && (
                  <motion.div
                    className="flow-node-lock-hover"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flow-node-lock-badge" style={{ borderColor: `${color}60` }}>
                      <span>💎</span>
                      <span>Pro</span>
                    </div>
                    <div className="flow-node-lock-hint">升級解鎖路徑詳情</div>
                  </motion.div>
                )}
              </AnimatePresence>
              {hoveredLocked !== id && (
                <div className="flow-node-lock-static">🔒</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 概率條 — 全部可見 */}
      <div className="probability-bar">
        {nodeIds.map(id => {
          const node = nodes[id];
          if (!node) return null;
          const n = node as any;
          const color = n.color || nodeColors[id];
          const prob = n.prob ?? 0;
          const name = n.name?.split(' ')[0] || id.toUpperCase();

          return (
            <motion.div
              key={id}
              className="prob-segment"
              style={{
                width: `${prob}%`,
                background: `${color}25`,
                color: color,
                borderRight: '1px solid rgba(0,0,0,0.4)',
              }}
              onClick={() => handleNodeClick(id)}
              whileHover={{ scale: 1.02, backgroundColor: `${color}40` }}
              whileTap={{ scale: 0.98 }}
            >
              {name} {prob}%
            </motion.div>
          );
        })}
      </div>

      {showBlurDebug && <div className="blur-debug-overlay">Debug Mode</div>}
    </div>
  );
};