// ==========================================
// 模糊遮罩組件
// ==========================================

import React from 'react';
import { motion } from 'framer-motion';
import './BlurOverlay.css';

interface BlurOverlayProps {
  isBlurred: boolean;
  children: React.ReactNode;
  lockMessage?: string;
  onClick?: () => void;
}

export const BlurOverlay: React.FC<BlurOverlayProps> = ({
  isBlurred,
  children,
  lockMessage = '🔒 Pro 會員專屬',
  onClick,
}) => {
  if (!isBlurred) {
    return <>{children}</>;
  }

  return (
    <div className="blur-overlay-container">
      <div className="blurred-content">{children}</div>
      
      <motion.div
        className="blur-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClick}
      >
        <div className="blur-overlay-icon">🔒</div>
        <div className="blur-overlay-text">{lockMessage}</div>
        <button className="blur-overlay-btn" onClick={onClick}>
          升級 Pro 解鎖
        </button>
      </motion.div>
    </div>
  );
};
