// ==========================================
// Pro 徽章組件
// ==========================================

import React from 'react';
import './PremiumBadge.css';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ size = 'md' }) => {
  return (
    <span className={`premium-badge premium-badge-${size}`}>
      💎 Pro
    </span>
  );
};
