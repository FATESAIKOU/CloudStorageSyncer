import './FileList.css';
import FileItem from './FileItem';

function FileList({ files, onDownload, onDelete, onNavigate, currentPath }) {
  if (!files || files.length === 0) {
    return (
      <div className="file-list-empty">
        <div className="empty-icon">📁</div>
        <div className="empty-text">目前沒有檔案</div>
      </div>
    );
  }

  // 分離目錄和檔案
  const directories = files.filter(file => file.isDirectory);
  const regularFiles = files.filter(file => !file.isDirectory);

  return (
    <div className="file-list">
      <div className="file-list-header">
        <span className="file-count">
          共 {directories.length} 個資料夾，{regularFiles.length} 個檔案
        </span>
      </div>

      <div className="file-list-content">
        {/* 目錄列表 */}
        {directories.map((directory, index) => (
          <FileItem
            key={`dir-${index}`}
            file={directory}
            onDownload={onDownload}
            onDelete={onDelete}
            onNavigate={onNavigate}
          />
        ))}

        {/* 檔案列表 */}
        {regularFiles.map((file, index) => (
          <FileItem
            key={`file-${index}`}
            file={file}
            onDownload={onDownload}
            onDelete={onDelete}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

export default FileList;
