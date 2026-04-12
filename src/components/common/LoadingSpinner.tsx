// ==========================================
// 加載動畫組件
// ==========================================

import React from 'react';
import { motion } from 'framer-motion';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text 
}) => {
  return (
    <div className={`loading-spinner loading-spinner-${size}`}>
      <motion.div
        className="spinner"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <div className="spinner-ring"></div>
      </motion.div>
      {text && <div className="spinner-text">{text}</div>}
    </div>
  );
};
