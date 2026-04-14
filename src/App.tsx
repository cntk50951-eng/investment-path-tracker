// ==========================================
// 應用主組件
// ==========================================

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DashboardV2 from './pages/DashboardV2';
import NewsTimeline from './pages/NewsTimeline';
import { Login } from './pages/Login';
import { useAuthStore } from './store/useAuthStore';
import { useDebugStore } from './store/useDebugStore';
import { DebugPanel } from './components/common/DebugPanel';
import './styles/global.css';

// 認證保護組件
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuthStore();
  const { isDebugMode } = useDebugStore();

  // 調試模式允許未登錄訪問
  if (isDebugMode) {
    return <>{children}</>;
  }

  // 如果未登錄，跳轉到登錄頁
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { initAuthListener } = useAuthStore();
  const { isDebugMode } = useDebugStore();

  useEffect(() => {
    // 初始化 Firebase 認證監聽器
    initAuthListener();
  }, [initAuthListener]);

  return (
<Router>
        <div className="app">
          <Routes>
            {/* 公開路由 */}
            <Route path="/login" element={<Login />} />

            {/* V2 新版路由 */}
            <Route
              path="/v2"
              element={
                <ProtectedRoute>
                  <DashboardV2 />
                </ProtectedRoute>
              }
            />

            {/* 保護路由 */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/news"
              element={
                <ProtectedRoute>
                  <NewsTimeline />
                </ProtectedRoute>
              }
            />
          </Routes>

        {/* 調試面板（僅開發環境） */}
        {isDebugMode && <DebugPanel />}
      </div>
    </Router>
  );
};

export default App;
