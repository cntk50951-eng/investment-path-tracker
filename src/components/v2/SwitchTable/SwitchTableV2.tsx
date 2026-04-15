import React, { useMemo, useEffect } from 'react';
import { useDataStore } from '../../../store/useDataStore';
import { motion, AnimatePresence } from 'framer-motion';
import { calcProgress, getTier } from '../../../utils/validators';
import { getNodeColor } from '../../../utils/constants';
import './SwitchTableV2.css';

export const SwitchTableV2: React.FC = () => {
  const { switches, selectSwitch, selectedSwitch, selectedPath } = useDataStore();

  if (!switches) {
    return (
      <section className="switch-v2 glass-panel">
        <div className="switch-v2-loading">
          <span className="material-symbols-outlined switch-v2-spin">progress_activity</span>
          <span>載入切換數據...</span>
        </div>
      </section>
    );
  }

  const switchRows = useMemo(() => {
    return Object.entries(switches!)
      .map(([id, sw]) => {
        const progress = calcProgress(sw);
        const yesCount = sw.confirms.filter((c: any) => c.status === 'yes').length;
        const nearCount = sw.confirms.filter((c: any) => c.status === 'near').length;
        const noCount = sw.confirms.filter((c: any) => c.status === 'no').length;
        const tier = getTier(progress);

        let badge: string;
        let badgeClass: string;
        if (progress >= 0.6) { badge = '⚠️ 高度警戒'; badgeClass = 'critical'; }
        else if (progress >= 0.35) { badge = '🟡 需監控'; badgeClass = 'warning'; }
        else if (progress >= 0.15) { badge = '🔵 低壓力'; badgeClass = 'low'; }
        else { badge = '⚪ 未觸發'; badgeClass = 'inactive'; }

        return { id, from: sw.from, to: sw.to, trigger: sw.trigger, progress, yesCount, nearCount, noCount, totalCount: sw.confirms.length, time: sw.time, badge, badgeClass, tier };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [switches]);

  const handleRowClick = (switchId: string) => {
    selectSwitch(switchId === selectedSwitch ? null : switchId);
  };

  // 當選中切換時，自動滾動到詳情面板
  useEffect(() => {
    if (selectedSwitch && !selectedPath) {
      const detailPanel = document.getElementById('detailPanel');
      if (detailPanel) {
        setTimeout(() => {
          detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    }
  }, [selectedSwitch, selectedPath]);

  return (
    <section className="switch-v2 glass-panel">
      <div className="switch-v2-header">
        <div>
          <h3 className="switch-v2-title">Path Transition Matrix</h3>
          <p className="switch-v2-hint">
            <span className="material-symbols-outlined">touch_app</span>
            點擊行查看路徑切換詳情
          </p>
        </div>
        <span className="switch-v2-subtitle">路徑切換進度追蹤</span>
      </div>

      <div className="switch-v2-table-wrapper">
        <table className="switch-v2-table">
          <thead>
            <tr>
              <th>切換方向</th>
              <th>信心度</th>
              <th>進度</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {switchRows.map(row => (
                <motion.tr
                  key={row.id}
                  className={`switch-v2-row ${selectedSwitch === row.id ? 'active' : ''} ${row.badgeClass}`}
                  onClick={() => handleRowClick(row.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ 
                    backgroundColor: selectedSwitch === row.id 
                      ? 'rgba(163, 166, 255, 0.12)' 
                      : 'rgba(30, 41, 59, 0.5)',
                    x: 4
                  }}
                >
                  <td>
                    <div className="switch-v2-direction">
                      <span className="switch-v2-from" style={{ color: getNodeColor(row.from) }}>{row.from.toUpperCase()}</span>
                      <span className="material-symbols-outlined switch-v2-arrow">east</span>
                      <span className="switch-v2-to" style={{ color: getNodeColor(row.to) }}>{row.to.toUpperCase()}</span>
                    </div>
                  </td>
                  <td>
                    <span className="switch-v2-confidence">High ({Math.round(row.progress * 100)}%)</span>
                  </td>
                  <td>
                    <div className="switch-v2-progress-track">
                      <motion.div
                        className="switch-v2-progress-fill"
                        style={{ backgroundColor: getNodeColor(row.to) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${row.progress * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
                  </td>
                  <td>
                    <span className={`switch-v2-badge badge-${row.badgeClass}`}>
                      {row.badge}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {switchRows.length === 0 && (
        <div className="switch-v2-empty">暫無切換數據</div>
      )}
      
      {selectedSwitch && (
        <motion.div 
          className="switch-v2-selected-indicator"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <span className="material-symbols-outlined">expand_more</span>
          <span>已選擇 {switches[selectedSwitch]?.from.toUpperCase()} → {switches[selectedSwitch]?.to.toUpperCase()}</span>
          <span className="material-symbols-outlined">touch_app</span>
        </motion.div>
      )}
    </section>
  );
};