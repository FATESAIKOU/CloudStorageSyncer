import { createContext, useContext, useState, useEffect } from 'react';

const UploadQueueContext = createContext();

export function useUploadQueue() {
  const context = useContext(UploadQueueContext);
  if (!context) {
    throw new Error('useUploadQueue must be used within UploadQueueProvider');
  }
  return context;
}

export function UploadQueueProvider({ children, authHeader, uploadAPI }) {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [onCompleteCallback, setOnCompleteCallback] = useState(null);

  // 註冊上傳完成 callback
  const registerOnComplete = (callback) => {
    setOnCompleteCallback(() => callback);
  };

  // 加入任務到佇列
  const addToQueue = (tasks) => {
    setUploadQueue(prev => [...prev, ...tasks]);
  };

  // 監聽佇列變化，自動執行上傳
  useEffect(() => {
    if (isUploading) return; // 如果正在上傳，不處理

    const pendingTasks = uploadQueue.filter(t => t.status === 'pending');

    if (pendingTasks.length > 0) {
      // 取第一個 pending 任務
      const task = pendingTasks[0];
      uploadFile(task);
    }
  }, [uploadQueue, isUploading]);

  const uploadFile = async (task) => {
    setIsUploading(true);

    // 更新狀態為 uploading 並初始化進度
    setUploadQueue(prev => prev.map(t =>
      t.id === task.id ? {
        ...t,
        status: 'uploading',
        progress: 0,
        speed: 0,
        uploadedBytes: 0,
        totalBytes: task.file.size,
      } : t
    ));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', task.file);
      formData.append('s3_key', task.s3Key);
      formData.append('storage_class', task.storageClass);

      let startTime = Date.now();
      let lastLoaded = 0;
      let lastTime = startTime;

      // 追蹤上傳進度
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          const currentTime = Date.now();
          const timeDiff = (currentTime - lastTime) / 1000; // 秒
          const bytesDiff = e.loaded - lastLoaded;
          const speed = timeDiff > 0 ? Math.round(bytesDiff / timeDiff) : 0;

          setUploadQueue(prev => prev.map(t =>
            t.id === task.id ? {
              ...t,
              progress,
              speed,
              uploadedBytes: e.loaded,
            } : t
          ));

          lastLoaded = e.loaded;
          lastTime = currentTime;
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              // 上傳成功，通知外部並從佇列中移除
              if (onCompleteCallback) {
                onCompleteCallback({
                  s3Key: task.s3Key,
                  fileName: task.file.name,
                  size: task.file.size,
                  storageClass: task.storageClass,
                });
              }
              setUploadQueue(prev => prev.filter(t => t.id !== task.id));
              resolve(response);
            } else {
              // API 返回錯誤
              setUploadQueue(prev => prev.map(t =>
                t.id === task.id ? {
                  ...t,
                  status: 'failed',
                  error: response.message || 'Upload failed'
                } : t
              ));
              reject(new Error(response.message || 'Upload failed'));
            }
          } catch (error) {
            setUploadQueue(prev => prev.map(t =>
              t.id === task.id ? { ...t, status: 'failed', error: 'Invalid response' } : t
            ));
            reject(new Error('Invalid response'));
          }
        } else {
          setUploadQueue(prev => prev.map(t =>
            t.id === task.id ? {
              ...t,
              status: 'failed',
              error: `HTTP ${xhr.status}`
            } : t
          ));
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        console.error('Upload network error');
        setUploadQueue(prev => prev.map(t =>
          t.id === task.id ? { ...t, status: 'failed', error: 'Network error' } : t
        ));
        reject(new Error('Network error'));
        setIsUploading(false);
      };

      // 取得 API base URL
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
      xhr.open('POST', `${API_BASE_URL}/files/upload`);
      xhr.setRequestHeader('Authorization', authHeader);
      xhr.send(formData);
    });
  };

  const value = {
    uploadQueue,
    addToQueue,
    registerOnComplete,
  };

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
    </UploadQueueContext.Provider>
  );
}

export default UploadQueueContext;
