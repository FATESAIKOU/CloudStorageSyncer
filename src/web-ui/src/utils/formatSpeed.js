/**
 * 格式化上傳/下載速度顯示
 * @param {number} bytesPerSecond - 每秒位元組數
 * @returns {string} 格式化的速度字串
 */
export function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond || bytesPerSecond < 0) {
    return '0 B/s';
  }

  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond.toFixed(0)} B/s`;
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }
}
