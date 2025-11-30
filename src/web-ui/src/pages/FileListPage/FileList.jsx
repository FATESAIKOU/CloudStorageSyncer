import { useState, useEffect, useMemo } from 'react';
import './FileList.css';
import TreeNode from './TreeNode';
import UploadModal from './UploadModal';
import { buildFileTree, getAllPaths } from '../../utils/fileTree';
import { useUploadQueue } from '../../contexts/UploadQueueContext';

function FileList({ files, onDownload, onDelete, currentPath }) {
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [uploadModal, setUploadModal] = useState({ show: false, targetPath: '' });
  const { uploadQueue } = useUploadQueue();

  // 輔助函數：根據路徑找到節點
  const findNodeByPath = (node, targetPath) => {
    if (node.path === targetPath) return node;

    if (node.children) {
      for (const child of node.children) {
        const found = findNodeByPath(child, targetPath);
        if (found) return found;
      }
    }

    return null;
  };

  // 輔助函數：深拷貝樹結構
  const deepCloneTree = (node) => {
    const cloned = { ...node };
    if (node.children) {
      cloned.children = node.children.map(child => deepCloneTree(child));
    }
    return cloned;
  };

  // 輔助函數：注入上傳中和已完成的節點
  const injectUploadingNodes = (tree, uploadTasks) => {
    if (!tree) return tree;

    const clonedTree = deepCloneTree(tree);

    uploadTasks.forEach(task => {
      const { s3Key, file } = task;
      const pathParts = s3Key.split('/').filter(p => p);
      const fileName = pathParts[pathParts.length - 1];

      // 確保所有中間資料夾都存在
      let currentNode = clonedTree;
      let accumulatedPath = currentPath || '';

      // 遍歷路徑，建立或找到所有中間資料夾
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        accumulatedPath = accumulatedPath ? `${accumulatedPath}${folderName}/` : `${folderName}/`;

        // 確保 children 陣列存在
        if (!currentNode.children) {
          currentNode.children = [];
        }

        // 尋找或建立該資料夾節點
        let folderNode = currentNode.children.find(c => c.path === accumulatedPath);

        if (!folderNode) {
          // 建立新的資料夾節點
          folderNode = {
            name: folderName,
            path: accumulatedPath,
            fullPath: accumulatedPath,
            isDirectory: true,
            children: [],
          };
          currentNode.children.push(folderNode);
        }

        currentNode = folderNode;
      }

      // 現在 currentNode 是父節點
      if (!currentNode.children) {
        currentNode.children = [];
      }

      // 檢查是否已存在（從 S3 API 返回的檔案）
      const existingIndex = currentNode.children.findIndex(c => c.path === s3Key);

      if (task.status === 'completed') {
        // 上傳完成：替換或新增為正常節點
        const completedNode = {
          name: fileName,
          path: s3Key,
          fullPath: s3Key,
          isDirectory: false,
          size: file.size,
          lastModified: new Date().toISOString(), // 使用當前 UTC 時間（ISO 8601 格式）
          storageClass: task.storageClass || 'STANDARD',
        };

        if (existingIndex >= 0) {
          // 替換現有節點
          currentNode.children[existingIndex] = completedNode;
        } else {
          // 新增節點
          currentNode.children.unshift(completedNode);
        }
      } else if (task.status === 'uploading' || task.status === 'pending') {
        // 上傳中：顯示臨時上傳節點
        if (existingIndex < 0) {
          currentNode.children.unshift({
            name: fileName,
            path: s3Key,
            fullPath: s3Key,
            isDirectory: false,
            isUploading: true,
            uploadTask: {
              id: task.id,
              status: task.status,
              progress: task.progress || 0,
              speed: task.speed || 0,
              uploadedBytes: task.uploadedBytes || 0,
              totalBytes: task.totalBytes || file.size,
            },
          });
        }
      }
    });

    return clonedTree;
  };

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

  // 合併檔案樹和上傳任務
  const fileTreeWithUploads = useMemo(() => {
    if (!fileTree) return null;

    // 過濾出上傳中、待上傳、已完成的任務
    const activeUploads = uploadQueue.filter(
      t => t.status === 'pending' || t.status === 'uploading' || t.status === 'completed'
    );

    if (activeUploads.length === 0) return fileTree;

    return injectUploadingNodes(fileTree, activeUploads);
  }, [fileTree, uploadQueue]);

  // 計算統計資訊
  const stats = useMemo(() => {
    if (!fileTreeWithUploads || !fileTreeWithUploads.children) {
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

    fileTreeWithUploads.children.forEach(child => countNodes(child));

    return { directories, files: filesCount };
  }, [fileTreeWithUploads]);

  // 當檔案列表改變時，預設展開第一層
  useEffect(() => {
    if (fileTreeWithUploads && fileTreeWithUploads.children) {
      const firstLevelPaths = new Set();
      fileTreeWithUploads.children.forEach(child => {
        if (child.isDirectory) {
          firstLevelPaths.add(child.path);
        }
      });
      setExpandedPaths(firstLevelPaths);
    }
  }, [fileTreeWithUploads]);

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
    if (fileTreeWithUploads) {
      const allPaths = getAllPaths(fileTreeWithUploads);
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

  if (!files || files.length === 0) {
    return (
      <div className="file-list-empty">
        <div className="empty-icon">📁</div>
        <div className="empty-text">目前沒有檔案</div>
      </div>
    );
  }

  if (!fileTreeWithUploads) {
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
          node={fileTreeWithUploads}
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
      />
    </div>
  );
}

export default FileList;
