import { useState, useEffect, useMemo } from 'react';
import './FileList.css';
import TreeNode from './TreeNode';
import UploadModal from './UploadModal';
import { buildFileTree, getAllPaths } from '../../utils/fileTree';

function FileList({ files, onDownload, onDelete, onUpload, onUploadComplete, onNavigate, currentPath }) {
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [uploadModal, setUploadModal] = useState({ show: false, targetPath: '' });

  // 構建樹狀結構
  const fileTree = useMemo(() => {
    if (!files || files.length === 0) return null;

    // 轉換 S3 API 格式為統一格式
    const normalizedFiles = files.map(file => ({
      Key: file.Key || file.key,
      Size: file.Size || file.size,
      LastModified: file.LastModified || file.last_modified,
      StorageClass: file.StorageClass || file.storage_class,
    }));

    return buildFileTree(normalizedFiles, currentPath);
  }, [files, currentPath]);

  // 計算統計資訊
  const stats = useMemo(() => {
    if (!fileTree || !fileTree.children) {
      return { directories: 0, files: 0 };
    }

    let directories = 0;
    let filesCount = 0;

    function countNodes(node) {
      if (node.isDirectory) {
        directories++;
        if (node.children) {
          node.children.forEach(child => countNodes(child));
        }
      } else {
        filesCount++;
      }
    }

    fileTree.children.forEach(child => countNodes(child));

    return { directories, files: filesCount };
  }, [fileTree]);

  // 當檔案列表改變時，預設展開第一層
  useEffect(() => {
    if (fileTree && fileTree.children) {
      const firstLevelPaths = new Set();
      fileTree.children.forEach(child => {
        if (child.isDirectory) {
          firstLevelPaths.add(child.path);
        }
      });
      setExpandedPaths(firstLevelPaths);
    }
  }, [fileTree]);

  const handleToggle = (path) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleExpandAll = () => {
    if (fileTree) {
      const allPaths = getAllPaths(fileTree);
      setExpandedPaths(allPaths);
    }
  };

  const handleCollapseAll = () => {
    setExpandedPaths(new Set());
  };

  const handleUploadClick = (targetPath) => {
    setUploadModal({ show: true, targetPath });
  };

  const handleCloseUploadModal = () => {
    setUploadModal({ show: false, targetPath: '' });
  };

  const handleUploadModalComplete = async () => {
    // Modal 完成時，先關閉 Modal，再重新載入列表
    handleCloseUploadModal();
    if (onUploadComplete) {
      await onUploadComplete();
    }
  };

  if (!files || files.length === 0) {
    return (
      <div className="file-list-empty">
        <div className="empty-icon">📁</div>
        <div className="empty-text">目前沒有檔案</div>
      </div>
    );
  }

  if (!fileTree) {
    return (
      <div className="file-list-empty">
        <div className="empty-icon">⚠️</div>
        <div className="empty-text">無法載入檔案列表</div>
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <span className="file-count">
          共 {stats.directories} 個資料夾，{stats.files} 個檔案
        </span>
        <div className="file-list-actions">
          <button className="expand-button" onClick={handleExpandAll}>
            展開全部
          </button>
          <button className="expand-button" onClick={handleCollapseAll}>
            收合全部
          </button>
        </div>
      </div>

      <div className="file-list-content">
        <TreeNode
          node={fileTree}
          onDownload={onDownload}
          onDelete={onDelete}
          onUpload={handleUploadClick}
          expandedPaths={expandedPaths}
          onToggle={handleToggle}
        />
      </div>

      <UploadModal
        show={uploadModal.show}
        basePath={uploadModal.targetPath}
        onClose={handleCloseUploadModal}
        onComplete={handleUploadModalComplete}
        onUpload={onUpload}
        existingFiles={files}
      />
    </div>
  );
}

export default FileList;
