import { useState, useEffect } from 'react';
import './UploadModal.css';
import { STORAGE_CLASSES, formatFileSize } from '../../utils/constants';
import { useUploadQueue } from '../../contexts/UploadQueueContext';

function UploadModal({ show, basePath, onClose }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [subFolder, setSubFolder] = useState('');
  const [storageClass, setStorageClass] = useState('STANDARD');
  const { addToQueue } = useUploadQueue();

  // 重置狀態當 modal 關閉時
  useEffect(() => {
    if (!show) {
      setSelectedFiles([]);
      setSubFolder('');
      setStorageClass('STANDARD');
    }
  }, [show]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const fileObjects = files.map(file => ({
      file: file,
      relativePath: file.name // 單檔上傳時，relativePath 就是檔名
    }));
    setSelectedFiles(fileObjects);
  };

  const handleDirectorySelect = (e) => {
    const files = Array.from(e.target.files);
    const fileObjects = files.map(file => {
      // webkitRelativePath 包含資料夾結構，例如: "folder/subfolder/file.txt"
      const relativePath = file.webkitRelativePath || file.name;
      return {
        file: file,
        relativePath: relativePath
      };
    });
    setSelectedFiles(fileObjects);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      return;
    }

    // 建立上傳任務
    const tasks = selectedFiles.map(fileObj => {
      // 構建完整路徑
      let fullPath = basePath;
      if (subFolder.trim()) {
        const cleanSubFolder = subFolder.trim().replace(/^\/+|\/+$/g, '');
        fullPath = fullPath + cleanSubFolder + '/';
      }
      // 使用檔案的相對路徑（保留資料夾結構）
      fullPath = fullPath + fileObj.relativePath;

      return {
        id: crypto.randomUUID(),
        file: fileObj.file,
        s3Key: fullPath,
        storageClass: storageClass,
        status: 'pending',
      };
    });

    // 加入佇列
    addToQueue(tasks);

    // 立即關閉 Modal
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="upload-modal-overlay" onClick={handleCancel}>
      <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h2>上傳檔案</h2>
          <button className="close-button" onClick={handleCancel}>
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
            <label className="upload-label">選擇檔案或資料夾：</label>
            <div className="file-select-buttons">
              <label className="file-select-button">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="file-input-hidden"
                />
                📄 選擇檔案
              </label>
              <label className="file-select-button">
                <input
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  onChange={handleDirectorySelect}
                  className="file-input-hidden"
                />
                📁 選擇資料夾
              </label>
            </div>
          </div>

          {/* 已選檔案列表 */}
          {selectedFiles.length > 0 && (
            <div className="upload-section">
              <label className="upload-label">
                已選擇 {selectedFiles.length} 個檔案：
              </label>
              <div className="selected-files-list">
                {selectedFiles.map((fileObj, index) => (
                  <div key={index} className="selected-file-item">
                    <span className="file-icon">📄</span>
                    <span className="file-name" title={fileObj.relativePath}>
                      {fileObj.relativePath}
                    </span>
                    <span className="file-size">{formatFileSize(fileObj.file.size)}</span>
                    <button
                      className="remove-file-button"
                      onClick={() => handleRemoveFile(index)}
                      title="移除"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="upload-modal-footer">
          <button
            className="button button-secondary"
            onClick={handleCancel}
          >
            取消
          </button>
          <button
            className="button button-primary"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
          >
            開始上傳
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;
