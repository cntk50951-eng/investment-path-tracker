// ==========================================
// 概率條組件
// ==========================================

import React from 'react';
import { useDataStore } from '../../store/useDataStore';
import { motion } from 'framer-motion';
import './ProbBar.css';

export const ProbBar: React.FC = () => {
  const { investmentData, selectPath, selectedPath } = useDataStore();

  if (!investmentData?.nodes) {
    return null;
  }

  const handleSegmentClick = (nodeId: string) => {
    selectPath(nodeId === selectedPath ? null : nodeId);
  };

  // 按 ID 排序確保順序
  const sortedNodes = ['a', 'b', 'c', 'd', 'e']
    .map(id => investmentData.nodes[id])
    .filter(Boolean);

  return (
    <div className="prob-bar">
      {sortedNodes.map(node => (
        <motion.div
          key={node.id}
          className="prob-segment"
          style={{
            width: `${node.prob}%`,
            background: `${node.color}25`,
            color: node.color,
            borderRight: '1px solid rgba(0,0,0,0.4)',
          }}
          onClick={() => handleSegmentClick(node.id)}
          whileHover={{
            scale: 1.05,
            backgroundColor: `${node.color}40`,
            zIndex: 1,
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {node.name.split(' ')[0]} {node.prob}%
        </motion.div>
      ))}
    </div>
  );
};
