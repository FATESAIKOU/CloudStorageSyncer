import { useState } from 'react';
import './LoginForm.css';
import { authAPI, createAuthHeader } from '../../utils/api';
import { saveAuthData, DEFAULT_CREDENTIALS } from '../../utils/auth';

function LoginForm({ onLoginStart, onLoginSuccess, onLoginError }) {
  const [username, setUsername] = useState(DEFAULT_CREDENTIALS.username);
  const [password, setPassword] = useState(DEFAULT_CREDENTIALS.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      onLoginError('請輸入帳號和密碼');
      return;
    }

    onLoginStart();

    try {
      const authHeader = createAuthHeader(username, password);
      const response = await authAPI.login(username, password);

      if (response.success) {
        const authData = {
          username,
          authHeader,
          loginTime: new Date().toISOString(),
        };

        saveAuthData(authData);
        onLoginSuccess(authData);
      } else {
        onLoginError(response.message || '登入失敗');
      }
    } catch (error) {
      console.error('Login error:', error);
      onLoginError('連線失敗，請檢查網路或伺服器狀態');
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="username">帳號</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="請輸入帳號"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">密碼</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="請輸入密碼"
          required
        />
      </div>

      <button type="submit" className="login-button">
        登入
      </button>
    </form>
  );
}

export default LoginForm;
