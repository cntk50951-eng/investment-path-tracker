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

const NODES = {
  a: { id: 'a', name: 'A 金髮女孩', sub: '軟著陸+AI 加速', color: '#4ade80', x: 400, y: 55 },
  b: { id: 'b', name: 'B 滯脹迷霧', sub: '高通膨 + 溫和增長', color: '#fbbf24', x: 400, y: 215 },
  c: { id: 'c', name: 'C 硬著陸', sub: '衰退 + 急速降息', color: '#f87171', x: 680, y: 215 },
  d: { id: 'd', name: 'D 黑天鵝', sub: '地緣衝擊 + 供應鏈', color: '#a78bfa', x: 120, y: 370 },
  e: { id: 'e', name: 'E 再通膨 + 加息', sub: 'CPI 失控+Fed 反轉', color: '#f472b6', x: 680, y: 370 },
};

export const FlowDiagram: React.FC = () => {
  const { nodes, switches, selectSwitch, selectPath, selectedSwitch, selectedPath } = useDataStore();
  const { isPremium, showUpgradePrompt } = usePremiumStore();
  const { isDebugMode, mockPremium, showBlurDebug } = useDebugStore();
  const tier = getUserTier(isPremium, mockPremium);

  const nodesWithProb = useMemo(() => {
    if (!nodes) return {};
    return Object.fromEntries(
      Object.entries(nodes).map(([id, node]) => [
        id,
        { ...NODES[id as keyof typeof NODES], prob: node.prob, current: node.current },
      ])
    );
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

  if (!switches) {
    return <div className="flow-diagram-loading">加載流程圖...</div>;
  }
  const sortedSwitches = Object.entries(switches).sort(
    (a, b) => calcProgress(a[1]) - calcProgress(b[1])
  );

  return (
    <div className="flow-diagram">
      {/* 路徑 Tab 切換欄 */}
      <div className="path-tabs">
        {['a', 'b', 'c', 'd', 'e'].map(id => {
          const node = nodesWithProb[id];
          if (!node) return null;
          const isActive = selectedPath === id;
          const isCurrent = !!node.current;
          const perm = canViewPathDetail(isCurrent, tier, isDebugMode);

          return (
            <motion.button
              key={id}
              className={`path-tab ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''} ${!perm.allowed ? 'locked' : ''}`}
              style={{
                borderColor: isActive ? node.color : 'transparent',
                color: node.color,
              }}
              onClick={() => handleNodeClick(id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="tab-name">{node.name.split(' ')[0]}</span>
              <span className="tab-prob" style={{ fontFamily: 'var(--font-mono)' }}>{node.prob}%</span>
              {!perm.allowed && <span className="tab-lock">🔒</span>}
              {isCurrent && <span className="tab-current">⭐</span>}
            </motion.button>
          );
        })}
      </div>

      <svg viewBox="0 0 800 430" className="flow-svg">
        <defs>
          {['a', 'b', 'c', 'd', 'e'].map(id => (
            <marker key={id} id={`arrowhead-${id}`} markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
              <polygon points="0 0,7 2.5,0 5" fill={NODES[id as keyof typeof NODES].color} />
            </marker>
          ))}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glowE" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="coloredBlur" />
            <feFlood floodColor="#f472b6" floodOpacity="0.25" result="glowColor" />
            <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
            <feMerge><feMergeNode in="softGlow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g id="arrowLayer">
          {sortedSwitches.map(([switchId, sw]) => {
            const progress = calcProgress(sw);
            const toNode = NODES[sw.to as keyof typeof NODES];
            const fromNode = nodesWithProb[sw.from];
            const isCurrentPath = fromNode?.current;

            return (
              <g key={switchId} onClick={() => handleSwitchClick(switchId)} style={{ cursor: 'pointer' }}>
                <path d={sw.path} fill="none" stroke="transparent" strokeWidth="26" />
                <motion.path
                  d={sw.path}
                  fill="none"
                  stroke={toNode.color}
                  strokeWidth={1.2 + progress * 5}
                  markerEnd={`url(#arrowhead-${sw.to})`}
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
                    stroke={toNode.color}
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
          {Object.values(nodesWithProb).map(node => (
            <g key={node.id} onClick={() => handleNodeClick(node.id)} style={{ cursor: 'pointer' }} className="flow-node">
              {node.current && (
                <motion.circle
                  cx={node.x} cy={node.y} r={52}
                  fill="none" stroke={node.color} strokeWidth={1.5}
                  initial={{ opacity: 0.12, scale: 1 }}
                  animate={{ opacity: [0.12, 0.45, 0.12], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <motion.rect
                x={node.x - (node.id === 'e' ? 128 : 108) / 2}
                y={node.y - 24}
                width={node.id === 'e' ? 128 : 108}
                height={48}
                rx={11}
                fill={`${node.color}18`}
                stroke={node.color}
                strokeWidth={node.current ? 2.5 : selectedPath === node.id ? 2 : 1.5}
                filter={node.id === 'e' ? 'url(#glowE)' : node.current ? 'url(#glow)' : undefined}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              />
              <text x={node.x} y={node.y - 5} textAnchor="middle" fill={node.color} fontSize={10.5} fontWeight="700">
                {node.name}
              </text>
              {node.prob !== undefined && (
                <text x={node.x} y={node.y + 14} textAnchor="middle" fill={node.color} fontSize={16} fontWeight="800" fontFamily="var(--font-mono)">
                  {node.prob}%
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>

      {/* 概率條 */}
      <div className="probability-bar">
        {Object.values(nodesWithProb).map(node => (
          <motion.div
            key={node.id}
            className="prob-segment"
            style={{
              width: `${node.prob || 0}%`,
              background: `${node.color}25`,
              color: node.color,
              borderRight: '1px solid rgba(0,0,0,0.4)',
            }}
            onClick={() => handleNodeClick(node.id)}
            whileHover={{ scale: 1.02, backgroundColor: `${node.color}40` }}
            whileTap={{ scale: 0.98 }}
          >
            {node.id.toUpperCase()} {node.prob || 0}%
          </motion.div>
        ))}
      </div>

      {showBlurDebug && <div className="blur-debug-overlay">Debug Mode</div>}
    </div>
  );
};
