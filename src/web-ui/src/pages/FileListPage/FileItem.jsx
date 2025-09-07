import './FileItem.css';
import { formatFileSize, formatDate, getFileIcon } from '../../utils/constants';

function FileItem({ file, onDownload, onDelete, onNavigate }) {
  const handleClick = () => {
    if (file.isDirectory) {
      onNavigate(file.key);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    onDownload(file);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(file);
  };

  return (
    <div
      className={`file-item ${file.isDirectory ? 'directory' : 'file'}`}
      onClick={handleClick}
    >
      <div className="file-info">
        <div className="file-icon">
          {file.isDirectory ? '📁' : getFileIcon(file.key)}
        </div>

        <div className="file-details">
          <div className="file-name">
            {file.isDirectory
              ? file.key.replace(/\/$/, '').split('/').pop() || file.key.replace(/\/$/, '')
              : file.key.split('/').pop() || file.key
            }
          </div>

          <div className="file-meta">
            {!file.isDirectory && (
              <>
                <span className="file-size">
                  {formatFileSize(file.size)}
                </span>
                <span className="file-date">
                  {formatDate(file.lastModified)}
                </span>
                {file.storageClass && (
                  <span className="file-storage">
                    {file.storageClass}
                  </span>
                )}
              </>
            )}
            {file.isDirectory && (
              <span className="directory-label">資料夾</span>
            )}
          </div>
        </div>
      </div>

      <div className="file-actions">
        {!file.isDirectory && (
          <button
            className="action-button download"
            onClick={handleDownload}
            title="下載"
          >
            📥
          </button>
        )}

        <button
          className="action-button delete"
          onClick={handleDelete}
          title="刪除"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default FileItem;
