// ==========================================
// SVG 流程圖組件（含權限控制 + 路徑 Tab 切換）
// ==========================================

import React, { useMemo } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { usePremiumStore } from '../../store/usePremiumStore';
import { useDebugStore } from '../../store/useDebugStore';
import { motion } from 'framer-motion';
import { calcProgress } from '../../utils/validators';
import { canViewPathDetail, getUserTier } from '../../utils/permissions';
import './FlowDiagram.css';

const DEFAULT_PATH_COLORS: Record<string, string> = {
  a: '#4ade80',
  b: '#fbbf24',
  c: '#f87171',
  d: '#a78bfa',
  e: '#f472b6',
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

  const handleSwitchClick = (switchId: string) => {
    selectSwitch(switchId === selectedSwitch ? null : switchId);
  };

  const handleNodeClick = (nodeId: string) => {
    const node = nodes?.[nodeId];
    if (!node) return;
    const perm = canViewPathDetail(!!node.current, tier, isDebugMode);
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
          const isActive = selectedPath === id;
          const isCurrent = !!node.current;
          const color = (node as any).color || nodeColors[id];
          const perm = canViewPathDetail(isCurrent, tier, isDebugMode);

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
              <span className="tab-name">{(node as any).name?.split(' ')[0] || id.toUpperCase()}</span>
              <span className="tab-prob" style={{ fontFamily: 'var(--font-mono)' }}>{(node as any).prob ?? 0}%</span>
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
        </defs>

        <g id="arrowLayer">
          {sortedSwitches.map(([switchId, sw]) => {
            const progress = calcProgress(sw);
            const toId = sw.to;
            const toColor = nodeColors[toId] || '#94a3b8';
            const fromNode = nodes[sw.from];
            const isCurrentPath = fromNode ? !!(fromNode as any).current : false;

            return (
              <g key={switchId} onClick={() => handleSwitchClick(switchId)} style={{ cursor: 'pointer' }}>
                <path d={sw.path} fill="none" stroke="transparent" strokeWidth="26" />
                <motion.path
                  d={sw.path}
                  fill="none"
                  stroke={toColor}
                  strokeWidth={1.2 + progress * 5}
                  markerEnd={`url(#arrowhead-${toId})`}
                  opacity={0.12 + progress * 0.88}
                  strokeDasharray={isCurrentPath ? '12,5' : '7,4'}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
                {isCurrentPath && progress > 0.2 && (
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

      {/* 概率條 */}
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
