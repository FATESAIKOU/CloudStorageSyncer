/**
 * 檔案樹狀結構轉換工具
 */

/**
 * 將扁平的檔案列表轉換為樹狀結構
 * @param {Array} files - S3 返回的扁平檔案列表
 * @param {string} currentPath - 當前路徑前綴
 * @returns {Object} 樹狀結構的根節點
 */
export function buildFileTree(files, currentPath = '') {
  const root = {
    name: '',
    path: currentPath,
    children: [],
    isDirectory: true,
    isRoot: true,
  };

  // 過濾出當前路徑下的檔案
  const filteredFiles = files.filter(file => {
    if (currentPath) {
      return file.Key && file.Key.startsWith(currentPath);
    }
    return true;
  });

  // 建立路徑對應的節點映射
  const nodeMap = new Map();
  nodeMap.set(currentPath, root);

  filteredFiles.forEach(file => {
    const fullPath = file.Key || file.key;
    if (!fullPath) return;

    // 移除當前路徑前綴
    const relativePath = currentPath ? fullPath.substring(currentPath.length) : fullPath;

    // 分割路徑
    const parts = relativePath.split('/').filter(p => p);

    let currentNode = root;
    let accumulatedPath = currentPath;

    parts.forEach((part, index) => {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}${part}` : part;
      const isLastPart = index === parts.length - 1;
      const isDirectory = !isLastPart || fullPath.endsWith('/');

      if (isDirectory) {
        accumulatedPath += '/';
      }

      // 檢查節點是否已存在
      if (!nodeMap.has(accumulatedPath)) {
        const newNode = {
          name: part,
          path: accumulatedPath,
          fullPath: accumulatedPath,
          isDirectory,
          children: isDirectory ? [] : undefined,
          // 如果是檔案，保存檔案資訊
          ...(isLastPart && !isDirectory ? {
            size: file.Size || file.size,
            lastModified: file.LastModified || file.last_modified,
            storageClass: file.StorageClass || file.storage_class,
          } : {}),
        };

        currentNode.children.push(newNode);
        nodeMap.set(accumulatedPath, newNode);
      }

      currentNode = nodeMap.get(accumulatedPath);
    });
  });

  // 排序：目錄優先，然後按名稱排序
  sortTree(root);

  return root;
}

/**
 * 遞迴排序樹節點
 * @param {Object} node - 樹節點
 */
function sortTree(node) {
  if (!node.children || node.children.length === 0) {
    return;
  }

  node.children.sort((a, b) => {
    // 目錄優先
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    // 相同類型按名稱排序
    return a.name.localeCompare(b.name, 'zh-TW');
  });

  // 遞迴排序子節點
  node.children.forEach(child => {
    if (child.isDirectory) {
      sortTree(child);
    }
  });
}

/**
 * 展開所有節點的路徑集合
 * @param {Object} node - 樹節點
 * @returns {Set} 所有路徑的集合
 */
export function getAllPaths(node) {
  const paths = new Set();

  function traverse(n) {
    if (n.path) {
      paths.add(n.path);
    }
    if (n.children) {
      n.children.forEach(child => traverse(child));
    }
  }

  traverse(node);
  return paths;
}

/**
 * 取得節點的深度
 * @param {string} path - 節點路徑
 * @param {string} basePath - 基準路徑
 * @returns {number} 深度
 */
export function getNodeDepth(path, basePath = '') {
  const relativePath = basePath ? path.substring(basePath.length) : path;
  const parts = relativePath.split('/').filter(p => p);
  return parts.length;
}
