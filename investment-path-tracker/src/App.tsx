// ==========================================
// 應用主組件
// ==========================================

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import { useAuthStore } from './store/useAuthStore';
import './styles/global.css';
import './styles/animations.css';
import './styles/responsive.css';
import './styles/premium.css';

const App: React.FC = () => {
  const { initAuthListener } = useAuthStore();

  useEffect(() => {
    // 初始化 Firebase 認證監聽器
    initAuthListener();
  }, [initAuthListener]);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
