import { useState, useEffect, useCallback } from 'react';
import './FileList.css';

const API_BASE = 'http://localhost:8000';

function FileList({ authHeader, onAuthError }) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFiles = useCallback(async () => {
    if (!authHeader) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/files/list`, {
        headers: {
          'Authorization': authHeader
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.data?.files || []);
      } else if (response.status === 401) {
        // Authentication failed, notify parent
        onAuthError?.('Authentication expired');
      } else {
        throw new Error(`Failed to load files: ${response.status}`);
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [authHeader, onAuthError]);

  // Load files when component mounts or authHeader changes
  useEffect(() => {
    if (authHeader) {
      loadFiles();
    }
  }, [authHeader, loadFiles]);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const handleRefresh = () => {
    loadFiles();
  };

  if (isLoading) {
    return (
      <div className="file-list-container">
        <div className="file-list-header">
          <h2>Files</h2>
        </div>
        <div className="loading-message">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-list-container">
        <div className="file-list-header">
          <h2>Files</h2>
          <button onClick={handleRefresh} className="refresh-button">
            Refresh Files
          </button>
        </div>
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h2>Files ({files.length})</h2>
        <button onClick={handleRefresh} className="refresh-button">
          Refresh Files
        </button>
      </div>

      {files.length === 0 ? (
        <div className="no-files-message">No files found</div>
      ) : (
        <div className="file-table-container">
          <table className="file-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr key={index}>
                  <td>{file.key || 'Unknown'}</td>
                  <td>{formatFileSize(file.size)}</td>
                  <td>{formatDate(file.last_modified)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FileList;
