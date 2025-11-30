import { useState, useEffect, useMemo } from 'react';
import './FileList.css';
import TreeNode from './TreeNode';
import UploadModal from './UploadModal';
import { buildFileTree, getAllPaths } from '../../utils/fileTree';
import { useUploadQueue } from '../../contexts/UploadQueueContext';

function FileList({ files, onDownload, onDelete, currentPath }) {
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [uploadModal, setUploadModal] = useState({ show: false, targetPath: '' });
  const [completedUploads, setCompletedUploads] = useState([]); // 儲存已完成的上傳檔案
  const { uploadQueue, registerOnComplete } = useUploadQueue();

  // 處理上傳完成
  const handleUploadComplete = (uploadedFile) => {
    // 加入到本地已完成列表
    setCompletedUploads(prev => [...prev, uploadedFile]);
  };

  // 註冊上傳完成 callback
  useEffect(() => {
    registerOnComplete(handleUploadComplete);
  }, []);

  // 當檔案列表更新時，清理 completedUploads 中已經存在於 files 的項目
  useEffect(() => {
    if (!files || files.length === 0) return;

    const fileKeys = new Set(files.map(f => f.Key || f.key));
    setCompletedUploads(prev => prev.filter(item => !fileKeys.has(item.s3Key)));
  }, [files]);

  // 刪除檔案時也要從 completedUploads 中移除
  const handleDeleteFile = (file) => {
    setCompletedUploads(prev => prev.filter(item => item.s3Key !== file.key));
    onDelete(file);
  };

  // 輔助函數：深拷貝樹結構
  const deepCloneTree = (node) => {
    const cloned = { ...node };
    if (node.children) {
      cloned.children = node.children.map(child => deepCloneTree(child));
    }
    return cloned;
  };

  // 輔助函數：注入上傳中的節點
  const injectUploadingNodes = (tree, uploadTasks, completedFiles) => {
    if (!tree) return tree;

    const clonedTree = deepCloneTree(tree);

    // 處理上傳中和待上傳的任務
    uploadTasks.forEach(task => {
      if (task.status !== 'uploading' && task.status !== 'pending') return;

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

      // 檢查是否已存在
      const existingIndex = currentNode.children.findIndex(c => c.path === s3Key);

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
    });

    // 處理已完成的上傳檔案
    completedFiles.forEach(completedFile => {
      const { s3Key, fileName, size, storageClass } = completedFile;
      const pathParts = s3Key.split('/').filter(p => p);
      const name = fileName || pathParts[pathParts.length - 1];

      // 確保所有中間資料夾都存在
      let currentNode = clonedTree;
      let accumulatedPath = currentPath || '';

      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        accumulatedPath = accumulatedPath ? `${accumulatedPath}${folderName}/` : `${folderName}/`;

        if (!currentNode.children) {
          currentNode.children = [];
        }

        let folderNode = currentNode.children.find(c => c.path === accumulatedPath);

        if (!folderNode) {
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

      if (!currentNode.children) {
        currentNode.children = [];
      }

      const existingIndex = currentNode.children.findIndex(c => c.path === s3Key);

      const completedNode = {
        name: name,
        path: s3Key,
        fullPath: s3Key,
        isDirectory: false,
        size: size,
        lastModified: new Date().toISOString(),
        storageClass: storageClass || 'STANDARD',
      };

      if (existingIndex >= 0) {
        currentNode.children[existingIndex] = completedNode;
      } else {
        currentNode.children.unshift(completedNode);
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

  // 合併檔案樹、上傳任務和已完成上傳
  const fileTreeWithUploads = useMemo(() => {
    if (!fileTree) return null;

    // 只保留上傳中和待上傳的任務
    const activeUploads = uploadQueue.filter(
      t => t.status === 'pending' || t.status === 'uploading'
    );

    return injectUploadingNodes(fileTree, activeUploads, completedUploads);
  }, [fileTree, uploadQueue, completedUploads]);

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
          onDelete={handleDeleteFile}
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
