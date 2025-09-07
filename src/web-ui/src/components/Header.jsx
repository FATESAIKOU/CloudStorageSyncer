import './Header.css';

function Header({ onLogout }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <h1 className="app-title">Cloud Storage Syncer</h1>
        <button
          className="logout-button"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
