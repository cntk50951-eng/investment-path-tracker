import React, { useMemo } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { getNodeColor } from '../../../utils/constants';

const PATH_VIBRANT_COLORS: Record<string, string> = {
  a: '#43A047', b: '#EF6C00', c: '#E53935', d: '#8E24AA', e: '#D81B60',
  hka: '#43A047', hkb: '#EF6C00', hkc: '#E53935', hkd: '#8E24AA', hke: '#D81B60',
};

const PATH_BG_COLORS: Record<string, string> = {
  a: '#E8F5E9', b: '#FFF3E0', c: '#FFEBEE', d: '#F3E5F5', e: '#FCE4EC',
  hka: '#E8F5E9', hkb: '#FFF3E0', hkc: '#FFEBEE', hkd: '#F3E5F5', hke: '#FCE4EC',
};

const PATH_NAMES: Record<string, string> = {
  a: 'Goldilocks', b: 'Stagflation', c: 'Hard Landing', d: 'Black Swan', e: 'Re-inflation',
};

function calcProgress(switchData: any): number {
  if (!switchData?.confirms) return 0;
  const total = switchData.confirms.length;
  if (total === 0) return 0;
  const yesCount = switchData.confirms.filter((c: any) => c.status === 'yes').length;
  const nearCount = switchData.confirms.filter((c: any) => c.status === 'near').length;
  return Math.round(((yesCount + nearCount * 0.5) / total) * 100);
}

const FlowDiagramV3: React.FC = () => {
  const { nodes, switches, selectSwitch, selectPath, selectedSwitch, selectedPath } = useDataStore();

  const nodeList = useMemo(() => {
    if (!nodes) return [];
    return Object.entries(nodes)
      .map(([id, node]: [string, any]) => ({ id, ...node }))
      .sort((a: any, b: any) => (a.x || 0) - (b.x || 0));
  }, [nodes]);

  const switchList = useMemo(() => {
    if (!switches) return [];
    return Object.entries(switches).map(([id, sw]: [string, any]) => ({
      id,
      ...sw,
      progress: calcProgress(sw),
    }));
  }, [switches]);

  const currentNode = nodeList.find((n: any) => n.current);

  const top3NodeIds = useMemo(() => {
    return [...nodeList]
      .sort((a: any, b: any) => (b.prob || 0) - (a.prob || 0))
      .slice(0, 3)
      .map((n: any) => n.id);
  }, [nodeList]);

  const handleNodeClick = (nodeId: string) => {
    selectPath(selectedPath === nodeId ? null : nodeId);
  };

  const handleSwitchClick = (switchId: string) => {
    selectSwitch(selectedSwitch === switchId ? null : switchId);
  };

  if (!nodes || nodeList.length === 0) {
    return (
      <div className="v3-card v3-flow-card">
        <div className="v3-card-body v3-empty-state">
          <span className="material-symbols-outlined">hub</span>
          <p>加載路徑圖中...</p>
        </div>
      </div>
    );
  }

  const svgWidth = 1000;
  const svgHeight = 450;
  const paddingX = 100;

  const nodePositions: Record<string, { x: number; y: number }> = {};
  const cols = nodeList.length;

  nodeList.forEach((node: any, i: number) => {
    const x = paddingX + (i / Math.max(cols - 1, 1)) * (svgWidth - paddingX * 2);
    let y: number;
    if (node.current) {
      y = svgHeight * 0.42;
    } else {
      const offset = (i % 2 === 0 ? -1 : 1) * (svgHeight * 0.22);
      y = svgHeight * 0.5 + offset;
    }
    nodePositions[node.id] = { x, y };
  });

  if (currentNode && nodePositions[currentNode.id]) {
    nodePositions[currentNode.id] = {
      ...nodePositions[currentNode.id],
      y: svgHeight * 0.42,
    };
  }

  return (
    <div className="v3-card v3-flow-card">
      <div className="v3-card-header">
        <div>
          <h2 className="v3-card-title">Macro Path Alignment</h2>
          <p className="v3-card-subtitle">Current positioning across {cols} potential macroeconomic environments</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {nodeList.slice(0, 5).map((node: any) => (
            <span key={node.id} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              color: PATH_VIBRANT_COLORS[node.id] || '#767586',
              background: `${PATH_VIBRANT_COLORS[node.id] || '#767586'}15`,
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: PATH_VIBRANT_COLORS[node.id] || '#767586',
                display: 'inline-block',
              }} />
              {node.prob}%
            </span>
          ))}
        </div>
      </div>
      <div className="v3-card-body" style={{ position: 'relative', flex: 1 }}>
        <div className="v3-flow-bg" />
        <svg
          className="v3-flow-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ shapeRendering: 'crispEdges' }}
        >
          <defs>
            {nodeList.map((node: any) => {
              const color = PATH_VIBRANT_COLORS[node.id] || '#4648d4';
              return (
                <linearGradient key={`grad-${node.id}`} id={`grad-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="1" />
                  <stop offset="100%" stopColor={color} stopOpacity="1" />
                </linearGradient>
              );
            })}
          </defs>

          {switchList.map((sw: any) => {
            const fromPos = nodePositions[sw.from];
            const toPos = nodePositions[sw.to];
            if (!fromPos || !toPos) return null;
            const isSelected = selectedSwitch === sw.id;
            const progress = sw.progress || 0;
            const lineColor = PATH_VIBRANT_COLORS[sw.from] || '#4648d4';
            const isTop3From = top3NodeIds.includes(sw.from);
            const isTop3To = top3NodeIds.includes(sw.to);
            const isAnimated = isTop3From || isTop3To;
            const lineWidth = progress >= 50 ? 5 : progress >= 20 ? 3.5 : 2;

            return (
              <g key={`sw-${sw.id}`}>
                {/* Animated flowing dashed line for top-3 paths */}
                {isAnimated && (
                  <path
                    d={`M ${fromPos.x} ${fromPos.y} C ${(fromPos.x + toPos.x) / 2} ${fromPos.y}, ${(fromPos.x + toPos.x) / 2} ${toPos.y}, ${toPos.x} ${toPos.y}`}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={isSelected ? lineWidth + 3 : lineWidth + 2}
                    opacity={isSelected ? 0.5 : 0.35}
                    strokeDasharray={progress >= 50 ? '20 12' : progress >= 20 ? '14 10' : '10 8'}
                    className="v3-flow-line-animated"
                  />
                )}

                {/* Base line */}
                <path
                  d={`M ${fromPos.x} ${fromPos.y} C ${(fromPos.x + toPos.x) / 2} ${fromPos.y}, ${(fromPos.x + toPos.x) / 2} ${toPos.y}, ${toPos.x} ${toPos.y}`}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={isSelected ? lineWidth + 1 : lineWidth}
                  opacity={isSelected ? 0.7 : isAnimated ? 0.4 : 0.15}
                  style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
                  onClick={() => handleSwitchClick(sw.id)}
                />

                {/* Pulsing midpoint dot for high-progress switches */}
                {progress >= 20 && (
                  <circle
                    cx={(fromPos.x + toPos.x) / 2}
                    cy={(fromPos.y + toPos.y) / 2}
                    r={progress >= 50 ? 8 : 5}
                    fill={lineColor}
                    opacity={0.9}
                    className={progress >= 50 ? 'v3-pulse-dot' : ''}
                  />
                )}
              </g>
            );
          })}

          {nodeList.map((node: any) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            const color = PATH_VIBRANT_COLORS[node.id] || getNodeColor(node.id);
            const bgColor = PATH_BG_COLORS[node.id] || '#ffffff';
            const isSelected = selectedPath === node.id;
            const isCurrent = node.current;
            const isTop3 = top3NodeIds.includes(node.id);
            const r = isCurrent ? 40 : 32;
            const prob = Math.round(node.prob);

            return (
              <g
                key={node.id}
                className="v3-node-circle"
                onClick={() => handleNodeClick(node.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Animated pulsing ring for top-3 */}
                {isTop3 && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 22}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    opacity="0.35"
                    className="v3-pulse-ring"
                  />
                )}

                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 12}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeDasharray="8 4"
                    opacity="0.5"
                  />
                )}

                {/* Outer glow for current */}
                {isCurrent && (
                  <>
                    <circle cx={pos.x} cy={pos.y} r={r + 10} fill={color} opacity="0.08" />
                    <circle cx={pos.x} cy={pos.y} r={r + 6} fill={color} opacity="0.12" />
                  </>
                )}

                {/* Main circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={bgColor}
                  stroke={color}
                  strokeWidth={isCurrent ? 3.5 : isTop3 ? 3 : 2}
                />

                {/* Inner fill - larger for top-3 and current */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isCurrent ? 16 : isTop3 ? 12 : 8}
                  fill={color}
                />

                {/* Path letter */}
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isCurrent ? 16 : isTop3 ? 14 : 12}
                  fontWeight={700}
                  fill="#ffffff"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {node.id.toUpperCase()}
                </text>

                {/* Name label */}
                <text
                  x={pos.x}
                  y={pos.y - r - 18}
                  textAnchor="middle"
                  fontSize={isCurrent ? 16 : isTop3 ? 14 : 13}
                  fontWeight={700}
                  fill={color}
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  {node.name || PATH_NAMES[node.id] || node.id.toUpperCase()}
                </text>

                {/* Probability badge - pill shaped */}
                <g style={{ cursor: 'pointer' }}>
                  <rect
                    x={pos.x - 32}
                    y={pos.y + r + 10}
                    width={64}
                    height={26}
                    rx={7}
                    fill={color}
                    opacity={0.9}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + r + 27}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={700}
                    fill="#ffffff"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {prob}%
                  </text>
                </g>

                {/* Current state marker */}
                {isCurrent && (
                  <text
                    x={pos.x}
                    y={pos.y + r + 48}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="#4648d4"
                    fontFamily="'Inter', sans-serif"
                    letterSpacing="0.08em"
                  >
                    CURRENT
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export { FlowDiagramV3 };