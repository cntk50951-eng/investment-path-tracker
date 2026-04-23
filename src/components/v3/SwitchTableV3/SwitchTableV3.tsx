import React, { useMemo } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { getNodeColor } from '../../../utils/constants';

const TIER_MAP: Record<string, { label: string; color: string; className: string }> = {
  noise: { label: 'Dormant', color: '#767586', className: 'dormant' },
  early_warning: { label: 'Monitoring', color: '#e65100', className: 'monitoring' },
  initial_confirm: { label: 'Monitoring', color: '#e65100', className: 'monitoring' },
  strong: { label: 'Trending', color: '#4648d4', className: 'trending' },
  locked: { label: 'Critical', color: '#ba1a1a', className: 'critical' },
};

const TIME_LABELS: Record<string, string> = {
  a_b: '8-12 wks',
  a_c: '4-8 wks',
  a_d: '24+ wks',
  a_e: '12-24 wks',
  b_a: '12-24 wks',
  b_c: '8-12 wks',
  b_d: '6-12 wks',
  c_a: '4-8 wks',
  c_b: '12-24 wks',
  c_d: '24+ wks',
  c_e: '8-16 wks',
  d_e: '24+ wks',
};

function calcSwitchProgress(switchData: any): { progress: number; yesCount: number; nearCount: number; totalCount: number } {
  if (!switchData?.confirms) return { progress: 0, yesCount: 0, nearCount: 0, totalCount: 0 };
  const confirms = switchData.confirms;
  const total = confirms.length;
  if (total === 0) return { progress: 0, yesCount: 0, nearCount: 0, totalCount: 0 };
  const yesCount = confirms.filter((c: any) => c.status === 'yes').length;
  const nearCount = confirms.filter((c: any) => c.status === 'near').length;
  return {
    progress: Math.round(((yesCount + nearCount * 0.5) / total) * 100),
    yesCount,
    nearCount,
    totalCount: total,
  };
}

const SwitchTableV3: React.FC = () => {
  const { switches, selectSwitch, selectedSwitch } = useDataStore();

  const switchList = useMemo(() => {
    if (!switches) return [];
    return Object.entries(switches).map(([id, sw]: [string, any]) => {
      const progress = calcSwitchProgress(sw);
      const tier = progress.progress >= 67 ? 'strong' : progress.progress >= 33 ? 'initial_confirm' : progress.progress > 0 ? 'early_warning' : 'noise';
      return { id, ...sw, ...progress, tier };
    });
  }, [switches]);

  if (!switches || switchList.length === 0) {
    return (
      <div className="v3-card v3-switch-card">
        <div className="v3-card-body v3-empty-state">
          <span className="material-symbols-outlined">swap_horiz</span>
          <p>加載切換數據中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="v3-card v3-switch-card">
      <div className="v3-card-header">
        <div>
          <h3 className="v3-card-title">Active Transition Vectors</h3>
          <p className="v3-card-subtitle">Monitoring probability shifts across key macroeconomic scenarios</p>
        </div>
        <button className="v3-card-action">
          Export Data <span className="material-symbols-outlined">download</span>
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="v3-switch-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Direction</th>
              <th>Core Triggers</th>
              <th style={{ width: '160px' }}>Progress</th>
              <th style={{ width: '90px', textAlign: 'right' }}>Est. Time</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {switchList.map((sw: any) => {
              const fromColor = getNodeColor(sw.from);
              const toColor = getNodeColor(sw.to);
              const tierInfo = TIER_MAP[sw.tier] || TIER_MAP.noise;
              const progressColor = sw.tier === 'strong' ? '#4648d4' : sw.tier === 'initial_confirm' ? '#e65100' : sw.tier === 'early_warning' ? '#e65100' : '#767586';
              const timeLabel = TIME_LABELS[sw.id] || sw.time || '—';
              const isActive = selectedSwitch === sw.id;

              return (
                <tr
                  key={sw.id}
                  className={isActive ? 'v3-row-active' : ''}
                  onClick={() => selectSwitch(isActive ? null : sw.id)}
                >
                  <td>
                    <div className="v3-direction">
                      <span className="v3-direction-node v3-direction-from" style={{ color: fromColor }}>
                        {sw.from?.toUpperCase()}
                      </span>
                      <span className="material-symbols-outlined v3-direction-arrow">arrow_forward</span>
                      <span className="v3-direction-node v3-direction-to" style={{ background: `${toColor}18`, color: toColor, borderColor: `${toColor}33` }}>
                        {sw.to?.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="v3-trigger-main">{sw.trigger || '—'}</div>
                      {sw.desc && <div className="v3-trigger-sub">{sw.desc}</div>}
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="v3-macro-badge" style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                        fontWeight: 600,
                        color: progressColor,
                      }}>
                        {sw.progress}%
                      </span>
                      <div className="v3-progress-bar" style={{ marginTop: 6 }}>
                        <div className="v3-progress-fill" style={{ width: `${sw.progress}%`, background: progressColor }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'var(--v3-on-surface-variant)' }}>
                      {timeLabel}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`v3-status-tag ${tierInfo.className}`}>
                      {tierInfo.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { SwitchTableV3 };