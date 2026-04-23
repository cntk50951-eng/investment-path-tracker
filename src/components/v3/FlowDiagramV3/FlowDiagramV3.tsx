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

  const svgWidth = 720;
  const svgHeight = 280;
  const paddingX = 70;

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
              {(node.prob * 100).toFixed(0)}%
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
        >
          <defs>
            <filter id="v3glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="v3shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Switch flow lines */}
          {switchList.map((sw: any) => {
            const fromPos = nodePositions[sw.from];
            const toPos = nodePositions[sw.to];
            if (!fromPos || !toPos) return null;
            const isSelected = selectedSwitch === sw.id;
            const progress = sw.progress || 0;
            const lineColor = PATH_VIBRANT_COLORS[sw.from] || '#4648d4';
            const lineWidth = progress >= 50 ? 3 : progress >= 20 ? 2 : 1.5;

            return (
              <g key={`sw-${sw.id}`}>
                <path
                  d={`M ${fromPos.x} ${fromPos.y} C ${(fromPos.x + toPos.x) / 2} ${fromPos.y}, ${(fromPos.x + toPos.x) / 2} ${toPos.y}, ${toPos.x} ${toPos.y}`}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={isSelected ? lineWidth + 1 : lineWidth}
                  opacity={isSelected ? 0.6 : progress >= 20 ? 0.25 : 0.1}
                  strokeDasharray={isSelected ? '8 4' : progress >= 50 ? 'none' : '4 4'}
                  style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
                  onClick={() => handleSwitchClick(sw.id)}
                />
                {progress >= 50 && (
                  <circle
                    cx={(fromPos.x + toPos.x) / 2}
                    cy={(fromPos.y + toPos.y) / 2}
                    r={3}
                    fill={lineColor}
                    opacity={0.7}
                  />
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodeList.map((node: any) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            const color = PATH_VIBRANT_COLORS[node.id] || getNodeColor(node.id);
            const bgColor = PATH_BG_COLORS[node.id] || '#ffffff';
            const isSelected = selectedPath === node.id;
            const isCurrent = node.current;
            const r = isCurrent ? 22 : 16;
            const prob = Math.round(node.prob * 100);

            return (
              <g
                key={node.id}
                className="v3-node-circle"
                onClick={() => handleNodeClick(node.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 10}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                    opacity="0.5"
                  />
                )}

                {/* Outer glow for current */}
                {isCurrent && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 5}
                    fill={color}
                    opacity="0.12"
                  />
                )}

                {/* Main circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={bgColor}
                  stroke={color}
                  strokeWidth={isCurrent ? 3.5 : 2.5}
                  filter="url(#v3shadow)"
                />

                {/* Inner fill */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isCurrent ? 8 : 5}
                  fill={color}
                />

                {/* Path letter */}
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isCurrent ? 11 : 9}
                  fontWeight={700}
                  fill="#ffffff"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {node.id.toUpperCase()}
                </text>

                {/* Name label */}
                <text
                  x={pos.x}
                  y={pos.y - r - 12}
                  textAnchor="middle"
                  fontSize={isCurrent ? 13 : 11}
                  fontWeight={700}
                  fill={color}
                  fontFamily="'Space Grotesk', sans-serif"
                >
                  {node.name || PATH_NAMES[node.id] || node.id.toUpperCase()}
                </text>

                {/* Probability badge */}
                <g style={{ cursor: 'pointer' }}>
                  <rect
                    x={pos.x - 22}
                    y={pos.y + r + 6}
                    width={44}
                    height={18}
                    rx={4}
                    fill={color}
                    opacity={0.9}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + r + 19}
                    textAnchor="middle"
                    fontSize={11}
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
                    y={pos.y + r + 36}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={600}
                    fill="#4648d4"
                    fontFamily="'Inter', sans-serif"
                    letterSpacing="0.05em"
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