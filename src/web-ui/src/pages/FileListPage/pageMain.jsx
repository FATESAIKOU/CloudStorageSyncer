import { useState, useEffect } from 'react';
import './pageMain.css';
import Header from './Header';
import FileList from './FileList';
import SearchBar from './SearchBar';
import FileListToolbar from './FileListToolbar';
import DeleteConfirmModal from './DeleteConfirmModal';
import UploadModal from './UploadModal';
import ErrorMessage from '../../shared/components/ErrorMessage';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import { fileAPI } from '../../utils/api';

function FileListPage({ authData, onLogout, onAuthError }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, file: null });
  const [toolbarUploadModal, setToolbarUploadModal] = useState({ show: false });

  // 載入檔案列表
  const loadFiles = async (prefix = '') => {
    setLoading(true);
    setError('');

    try {
      const response = await fileAPI.list(authData.authHeader, prefix);

      if (response.success) {
        // 直接使用後端返回的數據格式
        const filesData = response.data?.files || [];
        setFiles(filesData);
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
        // 直接使用後端返回的數據格式
        const filesData = response.data?.files || [];
        setFiles(filesData);
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

  // 檔案上傳（純上傳函數，不含副作用）
  const handleUpload = async (file, s3Key, storageClass) => {
    try {
      const response = await fileAPI.upload(authData.authHeader, file, s3Key, storageClass);

      if (!response.success) {
        if (response.error_code === 'AUTH_001' || response.error_code === 'AUTH_002') {
          onAuthError('認證失效，請重新登入');
        } else {
          throw new Error(response.message || '上傳失敗');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // 上傳 Modal 完成時的回調（處理 reload）
  const handleUploadModalComplete = async () => {
    await loadFiles(currentPath);
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
      let response;

      // 判斷是資料夾還是檔案：key 以 '/' 結尾就是資料夾
      if (file.key.endsWith('/')) {
        // 刪除資料夾（遞迴）
        response = await fileAPI.deleteDirectory(authData.authHeader, file.key);
      } else {
        // 刪除單一檔案
        response = await fileAPI.delete(authData.authHeader, file.key);
      }

      if (response.success) {
        // 重新載入檔案列表並關閉刪除確認框
        await loadFiles(currentPath);
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

  // 工具列上傳按鈕
  const handleToolbarUploadClick = () => {
    setToolbarUploadModal({ show: true });
  };

  const handleCloseToolbarUploadModal = () => {
    setToolbarUploadModal({ show: false });
  };

  const handleToolbarUploadComplete = async () => {
    handleCloseToolbarUploadModal();
    await loadFiles(currentPath);
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

        {/* 工具列 - 提供根目錄上傳功能 */}
        <FileListToolbar
          currentPath={currentPath}
          onUploadClick={handleToolbarUploadClick}
        />

        {loading ? (
          <LoadingSpinner message="載入檔案列表..." />
        ) : (
          <FileList
            files={files}
            onDownload={handleDownload}
            onDelete={handleDeleteClick}
            onUpload={handleUpload}
            onUploadComplete={handleUploadModalComplete}
            currentPath={currentPath}
          />
        )}
      </main>

      {/* 工具列的上傳 Modal */}
      {toolbarUploadModal.show && (
        <UploadModal
          show={toolbarUploadModal.show}
          basePath={currentPath}
          onClose={handleCloseToolbarUploadModal}
          onComplete={handleToolbarUploadComplete}
          onUpload={handleUpload}
        />
      )}

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
