import React from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { getNodeColor } from '../../../utils/constants';

const ProgressTag: React.FC<{ progress: number }> = ({ progress }) => {
  const label = progress >= 67 ? 'Strong' : progress >= 33 ? 'Emerging' : 'Early';
  const color = progress >= 67 ? '#2e7d32' : progress >= 33 ? '#e65100' : '#767586';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      fontWeight: 600,
      color,
    }}>
      {progress}% · {label}
    </span>
  );
};

const ConfirmSignalItem: React.FC<{ signal: any }> = ({ signal }) => {
  const statusConfig: Record<string, { icon: string; color: string }> = {
    yes: { icon: 'check_circle', color: '#2e7d32' },
    near: { icon: 'schedule', color: '#e65100' },
    no: { icon: 'radio_button_unchecked', color: '#767586' },
  };
  const config = statusConfig[signal.status] || statusConfig.no;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: config.color, marginTop: 1 }}>
        {config.icon}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--v3-on-surface)' }}>{signal.text}</div>
        {signal.actual && (
          <div style={{ fontSize: 12, color: 'var(--v3-on-surface-variant)', marginTop: 2 }}>{signal.actual}</div>
        )}
      </div>
    </div>
  );
};

const DetailPanelV3: React.FC = () => {
  const { selectedSwitch, selectedPath, nodes, switches } = useDataStore();

  if (!selectedSwitch && !selectedPath) return null;

  const closePanel = () => {
    useDataStore.getState().selectSwitch(null);
    useDataStore.getState().selectPath(null);
  };

  let content: React.ReactNode = null;

  if (selectedSwitch && switches) {
    const sw: any = switches[selectedSwitch];
    if (sw) {
      const fromColor = getNodeColor(sw.from);
      const toColor = getNodeColor(sw.to);
      const confirms = sw.confirms || [];
      const yesCount = confirms.filter((c: any) => c.status === 'yes').length;
      const nearCount = confirms.filter((c: any) => c.status === 'near').length;
      const total = confirms.length || 1;
      const progress = Math.round(((yesCount + nearCount * 0.5) / total) * 100);

      content = (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                background: `${fromColor}18`,
                color: fromColor,
                border: `1px solid ${fromColor}33`,
              }}>
                {sw.from?.toUpperCase()}
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--v3-outline)' }}>arrow_forward</span>
              <span style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                background: `${toColor}18`,
                color: toColor,
                border: `1px solid ${toColor}33`,
              }}>
                {sw.to?.toUpperCase()}
              </span>
            </div>
            <ProgressTag progress={progress} />
          </div>

          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: 'var(--v3-on-surface)', marginBottom: 4 }}>
              {sw.trigger || 'Transition Trigger'}
            </h3>
            {sw.desc && <p style={{ fontSize: 13, color: 'var(--v3-on-surface-variant)', lineHeight: 1.5 }}>{sw.desc}</p>}
          </div>

          <div style={{ background: 'var(--v3-surface-container)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--v3-on-surface-variant)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Progress
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 8, background: 'var(--v3-surface-variant)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 4,
                  background: progress >= 67 ? '#2e7d32' : progress >= 33 ? '#e65100' : '#767586',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600 }}>{progress}%</span>
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--v3-on-surface-variant)' }}>
              <span>✓ {yesCount} confirmed</span>
              <span>◐ {nearCount} emerging</span>
              <span>○ {confirms.length - yesCount - nearCount} pending</span>
            </div>
          </div>

          {confirms.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--v3-on-surface-variant)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Confirmation Signals
              </div>
              {confirms.map((signal: any, i: number) => (
                <ConfirmSignalItem key={i} signal={signal} />
              ))}
            </div>
          )}

          {sw.nextCheck && (
            <div style={{ fontSize: 12, color: 'var(--v3-on-surface-variant)', borderTop: '1px solid var(--v3-surface-variant)', paddingTop: 12 }}>
              Next check: <strong>{sw.nextCheck}</strong>
            </div>
          )}
        </div>
      );
    }
  }

  if (selectedPath && nodes) {
    const node: any = nodes[selectedPath];
    if (node) {
      const color = getNodeColor(selectedPath);
      const allocItems = node.alloc || [];

      content = (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${color}18`, border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color,
            }}>
              {selectedPath.toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--v3-on-surface)' }}>
                {node.name}
              </h3>
              {node.sub && <p style={{ fontSize: 13, color: 'var(--v3-on-surface-variant)', marginTop: 2 }}>{node.sub}</p>}
            </div>
          </div>

          <div style={{ background: 'var(--v3-surface-container)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--v3-on-surface-variant)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Probability
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color }}>
              {(node.prob * 100).toFixed(0)}%
            </div>
          </div>

          {allocItems.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--v3-on-surface-variant)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Sector Allocation
              </div>
              {allocItems.map((alloc: any, i: number) => {
                const tierColors: Record<string, string> = {
                  overweight: '#2e7d32',
                  neutral: '#e65100',
                  underweight: '#767586',
                  avoid: '#ba1a1a',
                };
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < allocItems.length - 1 ? '1px solid var(--v3-surface-variant)' : 'none' }}>
                    <span style={{ fontSize: 13, color: 'var(--v3-on-surface)' }}>{alloc.n}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                      padding: '2px 8px', borderRadius: 4,
                      background: `${tierColors[alloc.tier] || '#767586'}12`,
                      color: tierColors[alloc.tier] || '#767586',
                      textTransform: 'capitalize',
                    }}>
                      {alloc.tier}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  }

  if (!content) return null;

  return (
    <>
      <div className="v3-detail-overlay" onClick={closePanel} />
      <div className="v3-detail-panel">
        <button
          className="v3-icon-btn v3-detail-close"
          onClick={closePanel}
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        {content}
      </div>
    </>
  );
};

export { DetailPanelV3 };