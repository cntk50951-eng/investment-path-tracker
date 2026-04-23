// ==========================================
// 應用主組件
// ==========================================

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DashboardV2 from './pages/DashboardV2';
import DashboardV3 from './pages/DashboardV3';
import NewsTimeline from './pages/NewsTimeline';
import { Login } from './pages/Login';
import { useAuthStore } from './store/useAuthStore';
import { useDebugStore } from './store/useDebugStore';
import { DebugPanel } from './components/common/DebugPanel';
import './styles/global.css';

// Debug 重新打開按鈕（隱藏後顯示）
const DebugReopenButton: React.FC = () => {
  const { toggleDebug, isAdmin } = useDebugStore();

  if (!isAdmin) return null;

  return (
    <button
      className="debug-reopen-btn"
      onClick={toggleDebug}
      title="重新打開調試面板 (Ctrl+Shift+D)"
    >
      <span className="material-symbols-outlined">bug_report</span>
    </button>
  );
};

// 認證保護組件 — 訂閱/付費功能需要登錄
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = false }) => {
  const { user } = useAuthStore();
  const { isDebugMode } = useDebugStore();

  // 調試模式允許未登錄訪問
  if (isDebugMode) {
    return <>{children}</>;
  }

  // 需要認證的路由（如訂閱頁面），未登錄則跳轉到登錄頁
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // 一般頁面：登錄用戶和遊客都可以訪問
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

            {/* V2 新版路由 - 根路徑和 /v2 都指向新版 — 遊客可訪問 */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardV2 />
                </ProtectedRoute>
              }
            />

            <Route
              path="/v2"
              element={
                <ProtectedRoute>
                  <DashboardV2 />
                </ProtectedRoute>
              }
            />

            {/* V3 Aether Command 亮色主題 */}
            <Route
              path="/v3"
              element={
                <ProtectedRoute>
                  <DashboardV3 />
                </ProtectedRoute>
              }
            />

            {/* 舊版 Dashboard 移至 /classic */}
            <Route
              path="/classic"
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

        {/* Debug 模式隱藏後的重新打開按鈕 — 僅管理員可見 */}
        {!isDebugMode && <DebugReopenButton />}
      </div>
    </Router>
  );
};

export default App;