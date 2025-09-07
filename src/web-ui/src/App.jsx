import { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage/pageMain';
import FileListPage from './pages/FileListPage/pageMain';
import { loadAuthData, clearAuthData, isAuthDataValid, isAuthExpired } from './utils/auth';

function App() {
  const [authData, setAuthData] = useState(null);

  // 處理登入成功
  const handleLoginSuccess = (userData) => {
    setAuthData(userData);
  };

  // 處理登出
  const handleLogout = () => {
    clearAuthData();
    setAuthData(null);
  };

  // 處理認證錯誤
  const handleAuthError = (errorMessage) => {
    console.error('Auth error:', errorMessage);
    clearAuthData();
    setAuthData(null);
  };

  // 初始化時檢查儲存的認證資料
  useEffect(() => {
    const savedAuthData = loadAuthData();

    if (savedAuthData && isAuthDataValid(savedAuthData) && !isAuthExpired(savedAuthData)) {
      setAuthData(savedAuthData);
    } else {
      clearAuthData();
    }
  }, []);

  // 如果沒有認證資料，顯示登入頁面
  if (!authData) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 已認證，顯示檔案列表頁面
  return (
    <FileListPage
      authData={authData}
      onLogout={handleLogout}
      onAuthError={handleAuthError}
    />
  );
}

export default App;
