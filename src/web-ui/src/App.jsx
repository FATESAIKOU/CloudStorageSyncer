import { useState } from 'react';
import './App.css';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import FileList from './components/FileList';

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleAuthError = (errorMessage) => {
    console.error('Auth error:', errorMessage);
    setUser(null);
  };

  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      <Header onLogout={handleLogout} />
      <main className="main-content">
        <FileList
          authHeader={user.authHeader}
          onAuthError={handleAuthError}
        />
      </main>
    </div>
  );
}

export default App;
