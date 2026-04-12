// ==========================================
// SVG 流程圖組件
// ==========================================

import React, { useMemo } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { usePremiumStore } from '../../store/usePremiumStore';
import { useDebugStore } from '../../store/useDebugStore';
import { motion } from 'framer-motion';
import { calcProgress } from '../../utils/validators';
import './FlowDiagram.css';

const NODES = {
  a: { id: 'a', name: 'A 金髮女孩', sub: '軟著陸+AI 加速', color: '#4ade80', x: 400, y: 55 },
  b: { id: 'b', name: 'B 滯脹迷霧', sub: '高通膨 + 溫和增長', color: '#fbbf24', x: 400, y: 215 },
  c: { id: 'c', name: 'C 硬著陸', sub: '衰退 + 急速降息', color: '#f87171', x: 680, y: 215 },
  d: { id: 'd', name: 'D 黑天鵝', sub: '地緣衝擊 + 供應鏈', color: '#a78bfa', x: 120, y: 370 },
  e: { id: 'e', name: 'E 再通膨 + 加息', sub: 'CPI 失控+Fed 反轉', color: '#f472b6', x: 680, y: 370 },
};

export const FlowDiagram: React.FC = () => {
  const { investmentData, selectSwitch, selectPath, selectedSwitch, selectedPath } = useDataStore();
  const { isPremium } = usePremiumStore();
  const { showBlurDebug } = useDebugStore();

  // 從數據中獲取概率和當前狀態
  const nodesWithProb = useMemo(() => {
    if (!investmentData?.nodes) return {};
    return Object.fromEntries(
      Object.entries(investmentData.nodes).map(([id, node]) => [
        id,
        { ...NODES[id as keyof typeof NODES], prob: node.prob, current: node.current },
      ])
    );
  }, [investmentData?.nodes]);

  // 處理切換點擊
  const handleSwitchClick = (switchId: string) => {
    if (!isPremium) return;
    selectSwitch(switchId === selectedSwitch ? null : switchId);
  };

  // 處理節點點擊
  const handleNodeClick = (nodeId: string) => {
    selectPath(nodeId === selectedPath ? null : nodeId);
  };

  if (!investmentData?.switches) {
    return <div className="flow-diagram-loading">加載流程圖...</div>;
  }

  const switches = investmentData.switches;

  // 按進度排序箭頭 (低進度先畫，高進度後畫)
  const sortedSwitches = Object.entries(switches).sort(
    (a, b) => calcProgress(a[1]) - calcProgress(b[1])
  );

  return (
    <div className="flow-diagram">
      <svg viewBox="0 0 800 430" className="flow-svg">
        <defs>
          {/* 箭頭定義 */}
          {['a', 'b', 'c', 'd', 'e'].map(id => (
            <marker
              key={id}
              id={`arrowhead-${id}`}
              markerWidth="7"
              markerHeight="5"
              refX="6"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0 0,7 2.5,0 5" fill={NODES[id as keyof typeof NODES].color} />
            </marker>
          ))}

          {/* 光暈濾鏡 */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 強光暈 (路徑 E) */}
          <filter id="glowE" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="coloredBlur" />
            <feFlood floodColor="#f472b6" floodOpacity="0.25" result="glowColor" />
            <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow" />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 箭頭層 */}
        <g id="arrowLayer">
          {sortedSwitches.map(([switchId, sw]) => {
            const progress = calcProgress(sw);
            const toNode = NODES[sw.to as keyof typeof NODES];
            const fromNode = nodesWithProb[sw.from as keyof typeof nodesWithProb];
            const isCurrentPath = fromNode?.current;

            return (
              <g key={switchId} onClick={() => handleSwitchClick(switchId)} style={{ cursor: 'pointer' }}>
                {/* 點擊熱區 */}
                <path
                  d={sw.path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="26"
                  className="arrow-hitbox"
                />

                {/* 可見箭頭 */}
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
                  className="arrow-path"
                />

                {/* 流動動畫 (僅當前路徑) */}
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
                    transition={{
                      duration: Math.max(0.5, 1.8 - progress * 1.5),
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}

                {/* 箭頭標籤 */}
                <g className="arrow-label" onClick={() => handleSwitchClick(switchId)}>
                  <rect
                    x={0}
                    y={0}
                    width={60}
                    height={20}
                    rx={4}
                    fill="rgba(8,12,24,0.92)"
                    stroke={toNode.color}
                    strokeWidth={progress > 0.35 ? 1.5 : 0.7}
                    strokeOpacity={0.25 + progress * 0.75}
                  />
                  <text
                    x={30}
                    y={14}
                    textAnchor="middle"
                    fill={toNode.color}
                    fontSize={progress > 0.35 ? 10 : 8.5}
                    fontWeight="700"
                  >
                    {fromNode?.id.toUpperCase()}→{toNode.id.toUpperCase()}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* 節點層 */}
        <g id="nodeLayer">
          {Object.values(nodesWithProb).map(node => (
            <g
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              style={{ cursor: 'pointer' }}
              className="flow-node"
            >
              {/* 脈衝光環 (當前路徑) */}
              {node.current && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={52}
                  fill="none"
                  stroke={node.color}
                  strokeWidth={1.5}
                  initial={{ opacity: 0.12, scale: 1 }}
                  animate={{ opacity: [0.12, 0.45, 0.12], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* 節點框 */}
              <motion.rect
                x={node.x - (node.id === 'e' ? 128 : 108) / 2}
                y={node.y - 24}
                width={node.id === 'e' ? 128 : 108}
                height={48}
                rx={11}
                fill={`${node.color}18`}
                stroke={node.color}
                strokeWidth={node.current ? 2.5 : 1.5}
                filter={node.id === 'e' ? 'url(#glowE)' : node.current ? 'url(#glow)' : undefined}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              />

              {/* 節點名稱 */}
              <text
                x={node.x}
                y={node.y - 5}
                textAnchor="middle"
                fill={node.color}
                fontSize={10.5}
                fontWeight="700"
              >
                {node.name}
              </text>

              {/* 概率 (如果數據存在) */}
              {node.prob !== undefined && (
                <text
                  x={node.x}
                  y={node.y + 14}
                  textAnchor="middle"
                  fill={node.color}
                  fontSize={16}
                  fontWeight="800"
                >
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
