// 認證相關工具函數

// 預設認證帳密
export const DEFAULT_CREDENTIALS = {
  username: 'admin',
  password: 'cloudsyncer2025',
};

// 將認證資訊儲存到 localStorage
export function saveAuthData(authData) {
  try {
    localStorage.setItem('cloudSyncerAuth', JSON.stringify(authData));
  } catch (error) {
    console.error('Failed to save auth data:', error);
  }
}

// 從 localStorage 讀取認證資訊
export function loadAuthData() {
  try {
    const data = localStorage.getItem('cloudSyncerAuth');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load auth data:', error);
    return null;
  }
}

// 清除認證資訊
export function clearAuthData() {
  try {
    localStorage.removeItem('cloudSyncerAuth');
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
}

// 檢查認證資訊是否有效
export function isAuthDataValid(authData) {
  return authData &&
         authData.username &&
         authData.authHeader &&
         authData.loginTime;
}

// 檢查認證是否過期（假設 24 小時過期）
export function isAuthExpired(authData) {
  if (!authData || !authData.loginTime) {
    return true;
  }

  const now = new Date().getTime();
  const loginTime = new Date(authData.loginTime).getTime();
  const expireTime = 24 * 60 * 60 * 1000; // 24 小時

  return (now - loginTime) > expireTime;
}

export default {
  DEFAULT_CREDENTIALS,
  saveAuthData,
  loadAuthData,
  clearAuthData,
  isAuthDataValid,
  isAuthExpired,
};
