import { useState, useEffect } from 'react';
import './UploadModal.css';
import { STORAGE_CLASSES, formatFileSize } from '../../utils/constants';

function UploadModal({ show, basePath, onClose, onComplete, onUpload }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [subFolder, setSubFolder] = useState('');
  const [storageClass, setStorageClass] = useState('STANDARD');
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // 重置狀態當 modal 關閉時
  useEffect(() => {
    if (!show) {
      setSelectedFiles([]);
      setSubFolder('');
      setStorageClass('STANDARD');
      setUploading(false);
      setUploadComplete(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  }, [show]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    setUploading(true);
    setUploadComplete(false);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // 構建完整路徑
        let fullPath = basePath;
        if (subFolder.trim()) {
          const cleanSubFolder = subFolder.trim().replace(/^\/+|\/+$/g, '');
          fullPath = fullPath + cleanSubFolder + '/';
        }
        fullPath = fullPath + file.name;

        await onUpload(file, fullPath, storageClass);

        setUploadProgress({ current: i + 1, total: selectedFiles.length });
      }

      // 上傳完成，顯示完成狀態
      setUploading(false);
      setUploadComplete(true);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
      setUploadComplete(false);
    }
  };

  const handleCancel = () => {
    if (!uploading) {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    // 關閉並觸發完成回調（重新載入列表）
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="upload-modal-overlay" onClick={handleCancel}>
      <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h2>上傳檔案</h2>
          <button className="close-button" onClick={handleCancel} disabled={uploading}>
            ✕
          </button>
        </div>

        <div className="upload-modal-body">
          {/* 基礎路徑顯示 */}
          <div className="upload-section">
            <label className="upload-label">上傳到：</label>
            <div className="base-path-display">
              {basePath || '/'}
            </div>
          </div>

          {/* 子資料夾輸入 */}
          <div className="upload-section">
            <label className="upload-label">
              子資料夾 <span className="optional-hint">(可選)</span>
            </label>
            <input
              type="text"
              className="upload-input"
              placeholder="例如: commands/utils"
              value={subFolder}
              onChange={(e) => setSubFolder(e.target.value)}
              disabled={uploading}
            />
            <div className="input-hint">
              可以建立多層資料夾，使用 / 分隔
            </div>
          </div>

          {/* Storage Class 選擇 */}
          <div className="upload-section">
            <label className="upload-label">儲存類別：</label>
            <select
              className="upload-select"
              value={storageClass}
              onChange={(e) => setStorageClass(e.target.value)}
              disabled={uploading}
            >
              {STORAGE_CLASSES.map(sc => (
                <option key={sc.value} value={sc.value}>
                  {sc.label}
                </option>
              ))}
            </select>
          </div>

          {/* 檔案選擇 */}
          <div className="upload-section">
            <label className="upload-label">選擇檔案：</label>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="file-input"
            />
          </div>

          {/* 已選檔案列表 */}
          {selectedFiles.length > 0 && (
            <div className="upload-section">
              <label className="upload-label">
                已選擇 {selectedFiles.length} 個檔案：
              </label>
              <div className="selected-files-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="selected-file-item">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    {!uploading && (
                      <button
                        className="remove-file-button"
                        onClick={() => handleRemoveFile(index)}
                        title="移除"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 上傳進度 */}
          {uploading && (
            <div className="upload-progress-section">
              <div className="progress-text">
                正在上傳... {uploadProgress.current}/{uploadProgress.total} 個檔案
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* 上傳完成提示 */}
          {uploadComplete && (
            <div className="upload-complete-section">
              <div className="complete-icon">✅</div>
              <div className="complete-text">
                上傳完成！共 {uploadProgress.total} 個檔案
              </div>
            </div>
          )}
        </div>

        <div className="upload-modal-footer">
          {uploadComplete ? (
            <button
              className="button button-primary button-full"
              onClick={handleConfirmClose}
            >
              確認關閉
            </button>
          ) : (
            <>
              <button
                className="button button-secondary"
                onClick={handleCancel}
                disabled={uploading}
              >
                取消
              </button>
              <button
                className="button button-primary"
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
              >
                {uploading ? '上傳中...' : '上傳'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
