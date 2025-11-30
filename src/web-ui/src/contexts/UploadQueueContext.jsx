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

    // 更新狀態為 uploading
    setUploadQueue(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: 'uploading' } : t
    ));

    try {
      await uploadAPI(task.file, task.s3Key, task.storageClass);

      // 上傳成功
      setUploadQueue(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'completed' } : t
      ));
    } catch (error) {
      console.error('Upload failed:', error);
      // 上傳失敗
      setUploadQueue(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: 'failed', error: error.message } : t
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const value = {
    uploadQueue,
    addToQueue,
  };

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
    </UploadQueueContext.Provider>
  );
}

export default UploadQueueContext;
