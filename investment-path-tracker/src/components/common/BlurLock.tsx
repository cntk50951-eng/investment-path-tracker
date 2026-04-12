// ==========================================
// 模糊鎖定組件
// ==========================================

import React from 'react';
import { motion } from 'framer-motion';
import './BlurLock.css';

interface BlurLockProps {
  children: React.ReactNode;
  isPremium?: boolean;
  level?: 'light' | 'medium' | 'heavy';
  showLockIcon?: boolean;
  onClick?: () => void;
}

export const BlurLock: React.FC<BlurLockProps> = ({
  children,
  isPremium = false,
  level = 'medium',
  showLockIcon = true,
  onClick,
}) => {
  if (isPremium) {
    return <>{children}</>;
  }

  const blurClass = {
    light: 'blur-light',
    medium: 'blur-medium',
    heavy: 'blur-heavy',
  }[level];

  return (
    <div className={`blur-lock-container ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className={`blur-lock ${blurClass}`}>
        {children}
      </div>
      {showLockIcon && (
        <motion.div
          className="blur-lock-overlay"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="blur-lock-icon">🔒 Pro</div>
        </motion.div>
      )}
    </div>
  );
};
