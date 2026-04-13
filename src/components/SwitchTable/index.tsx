// ==========================================
// 切換進度表組件
// ==========================================

import React, { useMemo } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { motion, AnimatePresence } from 'framer-motion';
import { calcProgress, getTier } from '../../utils/validators';
import { getNodeColor } from '../../utils/constants';
import './SwitchTable.css';

export const SwitchTable: React.FC = () => {
  const { switches, selectSwitch, selectedSwitch } = useDataStore();

  if (!switches) {
    return <div className="switch-table-loading">加載切換表...</div>;
  }

  // 計算每條切換的進度並排序
  const switchRows = useMemo(() => {
    return Object.entries(switches!)
      .map(([id, sw]) => {
        const progress = calcProgress(sw);
        const yesCount = sw.confirms.filter((c: any) => c.status === 'yes').length;
        const nearCount = sw.confirms.filter((c: any) => c.status === 'near').length;
        const noCount = sw.confirms.filter((c: any) => c.status === 'no').length;
        const tier = getTier(progress);

        // 確定狀態徽章
        let badge: string;
        let badgeClass: string;
        if (progress >= 0.6) {
          badge = '⚠️ 高度警戒';
          badgeClass = 'critical';
        } else if (progress >= 0.35) {
          badge = '🟡 需監控';
          badgeClass = 'warning';
        } else if (progress >= 0.15) {
          badge = '🔵 低壓力';
          badgeClass = 'low';
        } else {
          badge = '⚪ 未觸發';
          badgeClass = 'inactive';
        }

        return {
          id,
          from: sw.from,
          to: sw.to,
          trigger: sw.trigger,
          progress,
          yesCount,
          nearCount,
          noCount,
          totalCount: sw.confirms.length,
          time: sw.time,
          badge,
          badgeClass,
          tier,
        };
      })
      .sort((a, b) => b.progress - a.progress); // 按進度降序
  }, [switches]);

  const handleRowClick = (switchId: string) => {
    selectSwitch(switchId === selectedSwitch ? null : switchId);
  };

  return (
    <div className="switch-table">
      <h3>📊 路徑切換進度追蹤</h3>
      
      <table>
        <thead>
          <tr>
            <th>切換方向</th>
            <th>核心觸發</th>
            <th>確認進度</th>
            <th>已確認/總數</th>
            <th>預計時間</th>
            <th>狀態</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {switchRows.map(row => (
              <motion.tr
                key={row.id}
                className={`switch-row ${selectedSwitch === row.id ? 'active' : ''} ${row.badgeClass}`}
                onClick={() => handleRowClick(row.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.01, backgroundColor: 'rgba(30,41,59,0.4)' }}
              >
                {/* 切換方向 */}
                <td>
                  <span className="from-node" style={{ color: getNodesColor(row.from) }}>
                    {row.from.toUpperCase()}
                  </span>
                  <span className="arrow"> → </span>
                  <span className="to-node" style={{ color: getNodesColor(row.to) }}>
                    {row.to.toUpperCase()}
                  </span>
                </td>

                {/* 核心觸發 (截斷顯示) */}
                <td className="trigger-cell" title={row.trigger}>
                  {row.trigger.length > 40 ? row.trigger.substring(0, 40) + '…' : row.trigger}
                </td>

                {/* 進度條 */}
                <td>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      style={{ backgroundColor: getNodesColor(row.to) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${row.progress * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                </td>

                {/* 已確認/總數 */}
                <td>
                  <span className="progress-text" style={{ color: getNodesColor(row.to) }}>
                    {Math.round(row.progress * 100)}%
                  </span>
                  <span className="progress-detail">
                    ({row.yesCount}✅{row.nearCount > 0 ? ` ${row.nearCount}🔶` : ''}/{row.totalCount})
                  </span>
                </td>

                {/* 預計時間 */}
                <td className="time-cell">{row.time}</td>

                {/* 狀態徽章 */}
                <td>
                  <span className={`status-badge ${row.badgeClass}`}>
                    {row.badge}
                  </span>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      {switchRows.length === 0 && (
        <div className="no-data">暫無切換數據</div>
      )}
    </div>
  );
};

// 使用集中管理的顏色映射
function getNodesColor(nodeId: string): string {
  return getNodeColor(nodeId);
}
