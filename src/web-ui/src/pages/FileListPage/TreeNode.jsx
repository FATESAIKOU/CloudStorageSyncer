import { useState } from 'react';
import './TreeNode.css';
import { formatFileSize, formatDate, getFileIcon } from '../../utils/constants';

function TreeNode({ node, depth = 0, onDownload, onDelete, expandedPaths, onToggle }) {
  const isExpanded = expandedPaths.has(node.path);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (node.isDirectory && node.children && node.children.length > 0) {
      onToggle(node.path);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!node.isDirectory) {
      onDownload({
        key: node.path,
        size: node.size,
        last_modified: node.lastModified,
        storage_class: node.storageClass,
      });
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete({
      key: node.path,
      size: node.size,
      last_modified: node.lastModified,
      storage_class: node.storageClass,
    });
  };

  // 根節點不渲染
  if (node.isRoot) {
    return (
      <div className="tree-root">
        {node.children && node.children.map((child, index) => (
          <TreeNode
            key={child.path || index}
            node={child}
            depth={0}
            onDownload={onDownload}
            onDelete={onDelete}
            expandedPaths={expandedPaths}
            onToggle={onToggle}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div
        className={`tree-node ${node.isDirectory ? 'directory' : 'file'}`}
        style={{ paddingLeft: `${depth * 24}px` }}
        onClick={handleToggle}
      >
        {/* 展開/收合箭頭 */}
        <div className="tree-node-toggle">
          {node.isDirectory && node.children && node.children.length > 0 ? (
            <span className={`toggle-icon ${isExpanded ? 'expanded' : 'collapsed'}`}>
              ▶
            </span>
          ) : (
            <span className="toggle-icon-placeholder"></span>
          )}
        </div>

        {/* 檔案/資料夾圖示 */}
        <div className="tree-node-icon">
          {node.isDirectory ? '📁' : getFileIcon(node.name)}
        </div>

        {/* 檔案資訊 */}
        <div className="tree-node-info">
          <div className="tree-node-name" title={node.path}>
            {node.name}
          </div>

          {!node.isDirectory && (
            <div className="tree-node-meta">
              <span className="file-size">
                {formatFileSize(node.size)}
              </span>
              <span className="file-date">
                {formatDate(node.lastModified)}
              </span>
              {node.storageClass && (
                <span className="file-storage">
                  {node.storageClass}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 操作按鈕 */}
        <div className="tree-node-actions">
          {!node.isDirectory && (
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

      {/* 子節點 */}
      {node.isDirectory && isExpanded && node.children && (
        <div className="tree-node-children">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.path || index}
              node={child}
              depth={depth + 1}
              onDownload={onDownload}
              onDelete={onDelete}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default TreeNode;
