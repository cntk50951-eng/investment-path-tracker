import React, { useMemo } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { getNodeColor } from '../../../utils/constants';

const DEFAULT_PATH_COLORS: Record<string, string> = {
  a: '#2e7d32', b: '#e65100', c: '#c62828', d: '#6a1b9a', e: '#ad1457',
  hka: '#2e7d32', hkb: '#e65100', hkc: '#c62828', hkd: '#6a1b9a', hke: '#ad1457',
};

const FlowDiagramV3: React.FC = () => {
  const { nodes, switches, selectSwitch, selectPath, selectedSwitch, selectedPath } = useDataStore();

  const nodeList = useMemo(() => {
    if (!nodes) return [];
    return Object.values(nodes).sort((a: any, b: any) => (a.x || 0) - (b.x || 0));
  }, [nodes]);

  const switchList = useMemo(() => {
    if (!switches) return [];
    return Object.entries(switches).map(([id, sw]: [string, any]) => ({ id, ...sw }));
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

  const nodePositions: Record<string, { x: number; y: number }> = {};
  const svgWidth = 720;
  const svgHeight = 240;
  const padding = 60;

  nodeList.forEach((node: any, i: number) => {
    const cols = nodeList.length;
    nodePositions[node.id] = {
      x: padding + (i / (cols - 1)) * (svgWidth - padding * 2),
      y: node.current ? svgHeight / 2 : (i % 2 === 0 ? 50 : svgHeight - 50),
    };
  });

  if (currentNode && nodePositions[currentNode.id]) {
    nodePositions[currentNode.id] = { ...nodePositions[currentNode.id], y: svgHeight / 2 };
  }

  return (
    <div className="v3-card v3-flow-card">
      <div className="v3-card-header">
        <div>
          <h2 className="v3-card-title">Macro Path Alignment</h2>
          <p className="v3-card-subtitle">Current positioning across 5 potential macroeconomic environments</p>
        </div>
        <button className="v3-card-action">
          <span className="material-symbols-outlined">tune</span> View Parameters
        </button>
      </div>
      <div className="v3-card-body" style={{ position: 'relative', flex: 1 }}>
        <div className="v3-flow-bg" />
        <svg
          className="v3-flow-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="v3glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="v3flowGrad" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#4648d4" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#4648d4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4648d4" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {switchList.map((sw: any) => {
            const fromPos = nodePositions[sw.from];
            const toPos = nodePositions[sw.to];
            if (!fromPos || !toPos) return null;
            const isSelected = selectedSwitch === sw.id;
            return (
              <path
                key={sw.id}
                d={`M ${fromPos.x} ${fromPos.y} C ${(fromPos.x + toPos.x) / 2} ${fromPos.y}, ${(fromPos.x + toPos.x) / 2} ${toPos.y}, ${toPos.x} ${toPos.y}`}
                className={isSelected ? 'v3-flow-line-animated' : 'v3-flow-line'}
                stroke={getNodeColor(sw.from)}
                style={{ opacity: isSelected ? 0.8 : 0.25 }}
                onClick={() => handleSwitchClick(sw.id)}
              />
            );
          })}

          {nodeList.map((node: any) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            const color = getNodeColor(node.id) || DEFAULT_PATH_COLORS[node.id];
            const isSelected = selectedPath === node.id;
            const isCurrent = node.current;
            const r = isCurrent ? 18 : 13;

            return (
              <g
                key={node.id}
                className="v3-node-circle"
                onClick={() => handleNodeClick(node.id)}
                style={{ cursor: 'pointer' }}
              >
                {isSelected && (
                  <circle cx={pos.x} cy={pos.y} r={r + 8} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />
                )}
                <circle cx={pos.x} cy={pos.y} r={r} fill="#ffffff" stroke={color} strokeWidth={isCurrent ? 3 : 2} filter={isCurrent ? 'url(#v3glow)' : undefined} />
                <circle cx={pos.x} cy={pos.y} r={isCurrent ? 6 : 4} fill={color} opacity={0.8} />
                <text
                  x={pos.x}
                  y={isCurrent ? pos.y - r - 10 : pos.y + r + 16}
                  textAnchor="middle"
                  className="v3-node-label"
                  fontSize={isCurrent ? 13 : 11}
                  fontWeight={600}
                  fill={isCurrent ? color : '#1b1b23'}
                  fontFamily="Space Grotesk, sans-serif"
                >
                  {node.name}
                </text>
                <text
                  x={pos.x}
                  y={isCurrent ? pos.y - r - 10 : pos.y + r + 28}
                  textAnchor="middle"
                  className="v3-node-prob"
                  fontSize={10}
                  fill="#464554"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {`Prob: ${(node.prob * 100).toFixed(0)}%`}
                </text>
                {isCurrent && (
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fontSize={7}
                    fill="#4648d4"
                    fontWeight={600}
                    fontFamily="Inter, sans-serif"
                  >
                    NOW
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