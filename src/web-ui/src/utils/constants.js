// 應用程式常數定義

// 儲存類別選項
export const STORAGE_CLASSES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'REDUCED_REDUNDANCY', label: 'Reduced Redundancy' },
  { value: 'STANDARD_IA', label: 'Standard - Infrequent Access' },
  { value: 'ONEZONE_IA', label: 'One Zone - Infrequent Access' },
  { value: 'INTELLIGENT_TIERING', label: 'Intelligent Tiering' },
  { value: 'GLACIER', label: 'Glacier' },
  { value: 'DEEP_ARCHIVE', label: 'Glacier Deep Archive' },
];

// 檔案大小格式化
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 日期格式化
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 檔案類型檢查
export function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();

  const iconMap = {
    // 圖片
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
    // 文件
    'pdf': '📄', 'doc': '📄', 'docx': '📄', 'txt': '📄', 'md': '📄',
    // 程式碼
    'js': '📜', 'jsx': '📜', 'ts': '📜', 'tsx': '📜', 'py': '📜', 'java': '📜',
    // 資料
    'json': '📊', 'xml': '📊', 'csv': '📊', 'xlsx': '📊',
    // 壓縮檔
    'zip': '📦', 'rar': '📦', 'tar': '📦', 'gz': '📦',
    // 影片
    'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'mkv': '🎬',
    // 音訊
    'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
  };

  return iconMap[ext] || '📁';
}

export default {
  STORAGE_CLASSES,
  formatFileSize,
  formatDate,
  getFileIcon,
};
