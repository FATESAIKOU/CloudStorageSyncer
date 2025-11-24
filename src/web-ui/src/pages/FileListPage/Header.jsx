import './Header.css';

function Header({ username, onLogout, currentPath, onNavigate }) {
  const pathParts = currentPath ? currentPath.split('/').filter(Boolean) : [];

  const handlePathClick = (index) => {
    const newPath = pathParts.slice(0, index + 1).join('/');
    onNavigate(newPath);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">Cloud Storage Syncer</h1>

          <nav className="breadcrumb">
            <button
              className="breadcrumb-item"
              onClick={() => onNavigate('')}
            >
              🏠 根目錄
            </button>

            {pathParts.map((part, index) => (
              <span key={index} className="breadcrumb-separator">
                /
                <button
                  className="breadcrumb-item"
                  onClick={() => handlePathClick(index)}
                >
                  {part}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div className="header-right">
          <span className="username">👤 {username}</span>
          <button className="logout-button" onClick={onLogout}>
            登出
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
