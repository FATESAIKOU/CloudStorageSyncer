import { useState, useEffect } from 'react';
import './pageMain.css';
import Header from './Header';
import FileList from './FileList';
import SearchBar from './SearchBar';
import DeleteConfirmModal from './DeleteConfirmModal';
import ErrorMessage from '../../shared/components/ErrorMessage';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { fileAPI } from '../../utils/api';

function FileListPage({ authData, onLogout, onAuthError }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, file: null });

  // 載入檔案列表
  const loadFiles = async (prefix = '') => {
    setLoading(true);
    setError('');

    try {
      const response = await fileAPI.list(authData.authHeader, prefix);

      if (response.success) {
        // 後端返回的數據格式是 { data: { files: [...] } }
        const rawFiles = response.data?.files || response.data || [];

        // 轉換數據格式以符合前端期望
        const formattedFiles = rawFiles.map(file => ({
          key: file.key,
          size: file.size,
          lastModified: file.last_modified,
          storageClass: file.storage_class,
          isDirectory: file.key.endsWith('/'),
          etag: file.etag
        }));

        setFiles(formattedFiles);
        setCurrentPath(prefix);
      } else {
        if (response.error_code === 'AUTH_001' || response.error_code === 'AUTH_002') {
          onAuthError('認證失效，請重新登入');
        } else {
          setError(response.message || '載入檔案列表失敗');
        }
      }
    } catch (error) {
      console.error('Load files error:', error);
      setError('連線失敗，請檢查網路或伺服器狀態');
    } finally {
      setLoading(false);
    }
  };

  // 搜尋檔案
  const handleSearch = async (pattern) => {
    if (!pattern.trim()) {
      loadFiles(currentPath);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fileAPI.search(authData.authHeader, pattern, currentPath);

      if (response.success) {
        // 後端返回的數據格式是 { data: { files: [...] } }
        const rawFiles = response.data?.files || response.data || [];

        // 轉換數據格式以符合前端期望
        const formattedFiles = rawFiles.map(file => ({
          key: file.key,
          size: file.size,
          lastModified: file.last_modified,
          storageClass: file.storage_class,
          isDirectory: file.key.endsWith('/'),
          etag: file.etag
        }));

        setFiles(formattedFiles);
      } else {
        if (response.error_code === 'AUTH_001' || response.error_code === 'AUTH_002') {
          onAuthError('認證失效，請重新登入');
        } else {
          setError(response.message || '搜尋失敗');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('搜尋失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 檔案下載
  const handleDownload = async (file) => {
    try {
      const blob = await fileAPI.download(authData.authHeader, file.key);

      // 建立下載連結
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.key.split('/').pop(); // 取得檔案名
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('下載失敗，請稍後再試');
    }
  };

  // 檔案刪除確認
  const handleDeleteClick = (file) => {
    setDeleteModal({ show: true, file });
  };

  // 執行檔案刪除
  const handleDeleteConfirm = async () => {
    const { file } = deleteModal;
    setDeleteModal({ show: false, file: null });

    try {
      const response = await fileAPI.delete(authData.authHeader, file.key);

      if (response.success) {
        // 重新載入檔案列表
        loadFiles(currentPath);
      } else {
        if (response.error_code === 'AUTH_001' || response.error_code === 'AUTH_002') {
          onAuthError('認證失效，請重新登入');
        } else {
          setError(response.message || '刪除失敗');
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('刪除失敗，請稍後再試');
    }
  };

  // 目錄導航
  const handleNavigate = (path) => {
    loadFiles(path);
  };

  // 初始載入
  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div className="file-list-page">
      <Header
        username={authData.username}
        onLogout={onLogout}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />

      <main className="file-list-main">
        <SearchBar onSearch={handleSearch} />

        {error && (
          <ErrorMessage
            message={error}
            onClose={() => setError('')}
          />
        )}

        {loading ? (
          <LoadingSpinner message="載入檔案列表..." />
        ) : (
          <FileList
            files={files}
            onDownload={handleDownload}
            onDelete={handleDeleteClick}
            onNavigate={handleNavigate}
            currentPath={currentPath}
          />
        )}
      </main>

      {deleteModal.show && (
        <DeleteConfirmModal
          file={deleteModal.file}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal({ show: false, file: null })}
        />
      )}
    </div>
  );
}

export default FileListPage;
