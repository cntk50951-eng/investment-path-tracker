// ==========================================
// 骨架屏組件
// ==========================================

import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = '4px',
  className = '',
}) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
  />
);

/** 流程圖骨架屏 */
export const FlowDiagramSkeleton: React.FC = () => (
  <div className="skeleton-flow">
    <div className="skeleton-svg">
      <Skeleton width="108px" height="48px" borderRadius="11px" className="skeleton-node skeleton-node-top" />
      <Skeleton width="108px" height="48px" borderRadius="11px" className="skeleton-node skeleton-node-mid-left" />
      <Skeleton width="108px" height="48px" borderRadius="11px" className="skeleton-node skeleton-node-mid-right" />
      <Skeleton width="108px" height="48px" borderRadius="11px" className="skeleton-node skeleton-node-bot-left" />
      <Skeleton width="128px" height="48px" borderRadius="11px" className="skeleton-node skeleton-node-bot-right" />
    </div>
    <Skeleton height="24px" borderRadius="6px" className="skeleton-probbar" />
  </div>
);

/** 新聞面板骨架屏 */
export const NewsPanelSkeleton: React.FC = () => (
  <div className="skeleton-news">
    <Skeleton height="32px" className="skeleton-news-header" />
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="skeleton-news-item">
        <Skeleton width="40%" height="10px" />
        <Skeleton width="90%" height="14px" />
        <Skeleton width="60%" height="10px" />
      </div>
    ))}
  </div>
);

/** 切換表骨架屏 */
export const SwitchTableSkeleton: React.FC = () => (
  <div className="skeleton-table">
    <Skeleton height="20px" width="200px" className="skeleton-table-title" />
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="skeleton-table-row">
        <Skeleton width="60px" height="14px" />
        <Skeleton width="180px" height="14px" />
        <Skeleton width="80px" height="6px" borderRadius="3px" />
        <Skeleton width="50px" height="14px" />
        <Skeleton width="60px" height="14px" />
      </div>
    ))}
  </div>
);

/** 宏觀欄骨架屏 */
export const MacroBarSkeleton: React.FC = () => (
  <div className="skeleton-macro">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
      <Skeleton key={i} width="80px" height="52px" borderRadius="6px" />
    ))}
  </div>
);
