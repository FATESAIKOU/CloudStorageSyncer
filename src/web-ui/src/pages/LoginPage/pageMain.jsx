import { useState } from 'react';
import './pageMain.css';
import LoginForm from './LoginForm';
import ErrorMessage from '../../shared/components/ErrorMessage';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

function LoginPage({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginStart = () => {
    setLoading(true);
    setError('');
  };

  const handleLoginSuccess = (authData) => {
    setLoading(false);
    setError('');
    onLoginSuccess(authData);
  };

  const handleLoginError = (errorMessage) => {
    setLoading(false);
    setError(errorMessage);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Cloud Storage Syncer</h1>
          <p>請登入以存取您的檔案</p>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onClose={() => setError('')}
          />
        )}

        {loading ? (
          <LoadingSpinner message="登入中..." />
        ) : (
          <LoginForm
            onLoginStart={handleLoginStart}
            onLoginSuccess={handleLoginSuccess}
            onLoginError={handleLoginError}
          />
        )}
      </div>
    </div>
  );
}

export default LoginPage;
