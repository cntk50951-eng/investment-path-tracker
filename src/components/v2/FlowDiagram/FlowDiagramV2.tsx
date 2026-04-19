import React, { useMemo, useState } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { usePremiumStore } from '../../../store/usePremiumStore';
import { useDebugStore } from '../../../store/useDebugStore';
import { motion, AnimatePresence } from 'framer-motion';
import { calcProgress } from '../../../utils/validators';
import { canViewPathDetail, getUserTier } from '../../../utils/permissions';
import './FlowDiagramV2.css';

const DEFAULT_PATH_COLORS: Record<string, string> = {
  a: '#10b981', b: '#f59e0b', c: '#ff6e84', d: '#c180ff', e: '#ec4899',
};

export const FlowDiagramV2: React.FC = () => {
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
      colors[id] = (node as any).color || DEFAULT_PATH_COLORS[id.replace('hk', '')] || '#a6abbb';
    }
    return colors;
  }, [nodes]);

  const visibleForFree = useMemo(() => {
    // 在 debug 'all' 模式下，所有路徑都可見
    if (isDebugMode && useDebugStore.getState().debugVisibilityMode === 'all') {
      const set = new Set<string>();
      if (nodes) for (const id of Object.keys(nodes)) set.add(id);
      return set;
    }
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
  }, [nodes, isDebugMode]);

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

  const totalConvergence = useMemo(() => {
    if (!nodes) return 0;
    const current = Object.values(nodes).find((n: any) => n.current);
    return current ? (current as any).prob ?? 0 : 0;
  }, [nodes]);

  if (!switches || !nodes) {
    return (
      <section className="flow-v2 glass-panel">
        <div className="flow-v2-loading">
          <span className="material-symbols-outlined flow-v2-spin">progress_activity</span>
          <span>載入路徑模擬...</span>
        </div>
      </section>
    );
  }

  const sortedSwitches = Object.entries(switches).sort(
    (a, b) => calcProgress(a[1]) - calcProgress(b[1])
  );

  return (
    <section className="flow-v2 glass-panel">
      <div className="flow-v2-top-accent" />

      <div className="flow-v2-header">
        <div>
          <h2 className="flow-v2-title">Celestial Flow Map</h2>
          <p className="flow-v2-subtitle">即時模擬高概率投資路徑軌跡</p>
        </div>
        <div className="flow-v2-convergence">
          <div className="flow-v2-convergence-label">收斂度</div>
          <div className="flow-v2-convergence-value">{totalConvergence}%</div>
        </div>
      </div>

      <div className="flow-v2-tabs">
        {nodeIds.map(id => {
          const node = nodes[id];
          if (!node) return null;
          const n = node as any;
          const isActive = selectedPath === id;
          const isCurrent = !!n.current;
          const color = n.color || nodeColors[id];
          const isFreeVisible = visibleForFree.has(id);
          const isLocked = !isFreeVisible && !isCurrent && !isDebugMode;
          const perm = canViewPathDetail(isCurrent, tier, isDebugMode, isFreeVisible && !isCurrent);

          return (
            <button
              key={id}
              className={`flow-v2-tab ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${!perm.allowed ? 'locked' : ''}`}
              style={{ borderColor: isActive ? color : 'transparent', color }}
              onClick={() => handleNodeClick(id)}
            >
              <span className="flow-v2-tab-name">
                {isLocked ? '•••' : (n.name?.split(' ')[0] || id.toUpperCase())}
              </span>
              <span className="flow-v2-tab-prob">{n.prob ?? 0}%</span>
              {!perm.allowed && <span className="material-symbols-outlined flow-v2-lock-icon">lock</span>}
              {isCurrent && <span className="flow-v2-tab-star">⭐</span>}
            </button>
          );
        })}
      </div>

      <div className="flow-v2-viewport">
        <svg viewBox="0 0 800 430" className="flow-v2-svg">
          <defs>
            {nodeIds.map(id => {
              const color = nodeColors[id];
              return (
                <marker key={id} id={`v2-arrow-${id}`} markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                  <polygon points="0 0,7 2.5,0 5" fill={color} />
                </marker>
              );
            })}
            <filter id="v2-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g id="v2-arrowLayer">
            {sortedSwitches.map(([switchId, sw]) => {
              const progress = calcProgress(sw);
              const toId = sw.to;
              const fromId = sw.from;
              const toColor = nodeColors[toId] || '#a6abbb';
              const fromNode = nodes[fromId];
              const isCurrentPath = fromNode ? !!(fromNode as any).current : false;
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
                    strokeWidth={1.5 + progress * 4}
                    strokeDasharray={isCurrentPath ? '12,5' : '6,4'}
                    markerEnd={`url(#v2-arrow-${toId})`}
                    opacity={isArrowFullyVisible ? 0.3 + progress * 0.7 : 0.2}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                  />
                  {isCurrentPath && progress > 0.2 && isArrowFullyVisible && (
                    <motion.path
                      d={sw.path}
                      fill="none"
                      stroke={toColor}
                      strokeWidth={1.5 + progress * 4}
                      strokeDasharray="12,5"
                      opacity={0.5}
                      initial={{ pathOffset: 0 }}
                      animate={{ pathOffset: 17 }}
                      transition={{ duration: Math.max(0.5, 1.8 - progress * 1.5), repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </g>
              );
            })}
          </g>

          <g id="v2-nodeLayer">
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
              const isLocked = !isFreeVisible && !isCurrent && !isDebugMode;
              const w = isHighestProb ? 128 : 108;

              if (isLocked) {
                return (
                  <g key={id} onClick={() => handleNodeClick(id)} style={{ cursor: 'pointer' }} className="flow-v2-node-locked">
                    <rect x={x - 54} y={y - 24} width={108} height={48} rx={12} fill={`${color}08`} stroke={color} strokeWidth={1} strokeDasharray="4,4" opacity={0.3} />
                    <text x={x} y={y - 5} textAnchor="middle" fill={color} fontSize={10} fontWeight="600" opacity={0.25}>🔒</text>
                    <text x={x} y={y + 14} textAnchor="middle" fill={color} fontSize={14} fontWeight="700" fontFamily="var(--font-mono)" opacity={0.25}>{prob}%</text>
                  </g>
                );
              }

              return (
                <g key={id} onClick={() => handleNodeClick(id)} style={{ cursor: 'pointer' }} className="flow-v2-node">
                  {isCurrent && (
                    <motion.circle cx={x} cy={y} r={56} fill="none" stroke={color} strokeWidth={1.5}
                      initial={{ opacity: 0.12, scale: 1 }}
                      animate={{ opacity: [0.12, 0.4, 0.12], scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <motion.rect
                    x={x - w / 2} y={y - 24}
                    width={w} height={48}
                    rx={12}
                    fill={`${color}14`}
                    stroke={color}
                    strokeWidth={isCurrent ? 2.5 : selectedPath === id ? 2 : 1.5}
                    filter={isCurrent ? 'url(#v2-glow)' : undefined}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  />
                  <text x={x} y={y - 5} textAnchor="middle" fill={color} fontSize={10.5} fontWeight="700">{name}</text>
                  {prob !== undefined && (
                    <text x={x} y={y + 14} textAnchor="middle" fill={color} fontSize={16} fontWeight="800" fontFamily="var(--font-mono)">{prob}%</text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {nodeIds.map(id => {
          const node = nodes[id];
          if (!node) return null;
          const n = node as any;
          const isFreeVisible = visibleForFree.has(id);
          const isCurrent = !!n.current;
          const isLocked = !isFreeVisible && !isCurrent && !isDebugMode;
          if (!isLocked) return null;

          const x = n.x ?? 400;
          const y = n.y ?? 215;
          const leftPct = (x / 800) * 100;
          const topPct = (y / 430) * 100;
          const color = n.color || nodeColors[id];

          return (
            <div
              key={`lock-${id}`}
              className="flow-v2-lock-overlay"
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              onMouseEnter={() => setHoveredLocked(id)}
              onMouseLeave={() => setHoveredLocked(null)}
              onClick={() => showUpgradePrompt('升級 Pro 解鎖全部路徑', 'path')}
            >
              <AnimatePresence>
                {hoveredLocked === id && (
                  <motion.div
                    className="flow-v2-lock-hover"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flow-v2-lock-badge" style={{ borderColor: `${color}60` }}>
                      <span>💎</span>
                      <span>Pro</span>
                    </div>
                    <div className="flow-v2-lock-hint">升級解鎖路徑詳情</div>
                  </motion.div>
                )}
              </AnimatePresence>
              {hoveredLocked !== id && <div className="flow-v2-lock-static">🔒</div>}
            </div>
          );
        })}
      </div>

      <div className="flow-v2-probbar">
        <div className="flow-v2-probbar-header">
          <span>路徑概率分佈</span>
          <span>累計 100%</span>
        </div>
        <div className="flow-v2-probbar-track">
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
                className="flow-v2-prob-segment"
                style={{ width: `${prob}%`, background: `${color}60`, color }}
                onClick={() => handleNodeClick(id)}
                whileHover={{ scale: 1.02, backgroundColor: `${color}80` }}
                whileTap={{ scale: 0.98 }}
              >
                {name} {prob}%
              </motion.div>
            );
          })}
        </div>
      </div>

      {showBlurDebug && <div className="flow-v2-debug">Debug Mode</div>}
    </section>
  );
};