import './FileListToolbar.css';

function FileListToolbar({ currentPath, onUploadClick }) {
  return (
    <div className="file-list-toolbar">
      <div className="toolbar-info">
        <span className="current-path-label">當前位置：</span>
        <span className="current-path-value">
          {currentPath || '根目錄'}
        </span>
      </div>

      <div className="toolbar-actions">
        <button
          className="btn btn-primary toolbar-upload-btn"
          onClick={onUploadClick}
        >
          📤 上傳檔案
        </button>
      </div>
    </div>
  );
}

export default FileListToolbar;
