// ==========================================
// 時間軸篩選器組件
// ==========================================

import React from 'react';
import { getNodeColor } from '../../utils/constants';
import './TimelineFilter.css';

interface FilterState {
  severity?: 'critical' | 'medium' | 'positive';
  path?: string;
  tag?: string;
  timeRange?: '7d' | '30d' | '90d' | 'all';
}

interface TimelineFilterProps {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  availableTags: string[];
}

export const TimelineFilter: React.FC<TimelineFilterProps> = ({
  filter,
  onFilterChange,
  availableTags,
}) => {
  const paths = ['a', 'b', 'c', 'd', 'e'] as const;

  const handleSeverityChange = (severity?: 'critical' | 'medium' | 'positive') => {
    onFilterChange({ ...filter, severity });
  };

  const handlePathChange = (path?: string) => {
    onFilterChange({ ...filter, path });
  };

  const handleTagChange = (tag?: string) => {
    onFilterChange({ ...filter, tag });
  };

  const handleTimeRangeChange = (timeRange?: '7d' | '30d' | '90d' | 'all') => {
    onFilterChange({ ...filter, timeRange });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = filter.severity || filter.path || filter.tag || filter.timeRange;

  return (
    <div className="timeline-filter">
      {/* 嚴重性篩選 */}
      <div className="filter-section">
        <span className="filter-label">嚴重性</span>
        <div className="severity-filter">
          <button
            className={`severity-btn critical ${filter.severity === 'critical' ? 'active' : ''}`}
            onClick={() => handleSeverityChange(filter.severity === 'critical' ? undefined : 'critical')}
          >
            🔴 關鍵
          </button>
          <button
            className={`severity-btn medium ${filter.severity === 'medium' ? 'active' : ''}`}
            onClick={() => handleSeverityChange(filter.severity === 'medium' ? undefined : 'medium')}
          >
            🟡 中等
          </button>
          <button
            className={`severity-btn positive ${filter.severity === 'positive' ? 'active' : ''}`}
            onClick={() => handleSeverityChange(filter.severity === 'positive' ? undefined : 'positive')}
          >
            🟢 正面
          </button>
        </div>
      </div>

      {/* 路徑篩選 */}
      <div className="filter-section">
        <span className="filter-label">投資路徑</span>
        <div className="path-filter">
          {paths.map((path) => (
            <button
              key={path}
              className="path-btn"
              style={{
                background: getNodeColor(path),
                boxShadow: filter.path === path ? `0 0 15px ${getNodeColor(path)}` : 'none',
              }}
              onClick={() => handlePathChange(filter.path === path ? undefined : path)}
            >
              {path.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 時間範圍篩選 */}
      <div className="filter-section">
        <span className="filter-label">時間範圍</span>
        <div className="time-range-filter">
          <button
            className={`time-range-btn ${filter.timeRange === '7d' ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange(filter.timeRange === '7d' ? undefined : '7d')}
          >
            7 天
          </button>
          <button
            className={`time-range-btn ${filter.timeRange === '30d' ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange(filter.timeRange === '30d' ? undefined : '30d')}
          >
            30 天
          </button>
          <button
            className={`time-range-btn ${filter.timeRange === '90d' ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange(filter.timeRange === '90d' ? undefined : '90d')}
          >
            90 天
          </button>
          <button
            className={`time-range-btn ${filter.timeRange === 'all' || !filter.timeRange ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange(undefined)}
          >
            全部
          </button>
        </div>
      </div>

      {/* 標籤篩選 */}
      {availableTags.length > 0 && (
        <div className="filter-section">
          <span className="filter-label">標籤</span>
          <div className="tag-filter">
            {availableTags.slice(0, 12).map((tag) => (
              <button
                key={tag}
                className={`tag-btn ${filter.tag === tag ? 'active' : ''}`}
                onClick={() => handleTagChange(filter.tag === tag ? undefined : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 清除篩選 */}
      {hasActiveFilters && (
        <div className="filter-section" style={{ marginTop: '16px' }}>
          <button className="clear-filters" onClick={clearFilters}>
            清除所有篩選條件
          </button>
        </div>
      )}
    </div>
  );
};
