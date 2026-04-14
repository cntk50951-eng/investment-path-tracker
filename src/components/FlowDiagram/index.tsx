import React, { useMemo } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { usePremiumStore } from '../../store/usePremiumStore';
import { useDebugStore } from '../../store/useDebugStore';
import { motion } from 'framer-motion';
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
          const perm = canViewPathDetail(isCurrent, tier, isDebugMode, isFreeVisible && !isCurrent);
          const isBlurred = !isFreeVisible && !n.current;

          return (
            <motion.button
              key={id}
              className={`path-tab ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${!perm.allowed ? 'locked' : ''} ${isBlurred ? 'path-tab-blurred' : ''}`}
              style={{
                borderColor: isActive ? color : 'transparent',
                color: color,
              }}
              onClick={() => handleNodeClick(id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="tab-name">{n.name?.split(' ')[0] || id.toUpperCase()}</span>
              <span className="tab-prob" style={{ fontFamily: 'var(--font-mono)' }}>{n.prob ?? 0}%</span>
              {!perm.allowed && <span className="tab-lock">🔒</span>}
              {isCurrent && <span className="tab-current">⭐</span>}
            </motion.button>
          );
        })}
      </div>

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
          {/* 模糊濾鏡，用於 Free 用戶不可見的路徑 */}
          <filter id="blurFree" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
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
            // Free 用戶模糊：起點或終點不可見時模糊箭頭
            const isArrowHidden = !visibleForFree.has(fromId) && !visibleForFree.has(toId);
            const isArrowDimmed = !visibleForFree.has(fromId) || !visibleForFree.has(toId);

            return (
              <g key={switchId} onClick={() => handleSwitchClick(switchId)} style={{ cursor: 'pointer' }}>
                <path d={sw.path} fill="none" stroke="transparent" strokeWidth="26" />
                <motion.path
                  d={sw.path}
                  fill="none"
                  stroke={toColor}
                  strokeWidth={1.2 + progress * 5}
                  markerEnd={`url(#arrowhead-${toId})`}
                  opacity={isArrowHidden ? 0.08 : isArrowDimmed ? 0.25 : 0.12 + progress * 0.88}
                  strokeDasharray={isCurrentPath ? '12,5' : '7,4'}
                  filter={isArrowHidden ? 'url(#blurFree)' : undefined}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
                {isCurrentPath && progress > 0.2 && !isArrowHidden && (
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
            const isBlurred = !isFreeVisible && !isCurrent;

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
                  filter={isBlurred ? 'url(#blurFree)' : isHighestProb ? 'url(#glowHighProb)' : isCurrent ? 'url(#glow)' : undefined}
                  opacity={isBlurred ? 0.3 : 1}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                />
                <text x={x} y={y - 5} textAnchor="middle" fill={color} fontSize={10.5} fontWeight="700"
                      opacity={isBlurred ? 0.3 : 1}>
                  {name}
                </text>
                {prob !== undefined && (
                  <text x={x} y={y + 14} textAnchor="middle" fill={color} fontSize={16} fontWeight="800" fontFamily="var(--font-mono)"
                        opacity={isBlurred ? 0.3 : 1}>
                    {prob}%
                  </text>
                )}
                {/* Free 用戶鎖定圖標 */}
                {isBlurred && (
                  <text x={x + 50} y={y - 18} fontSize="11" textAnchor="middle" opacity="0.7">🔒</text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

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
