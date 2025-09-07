// API 基礎配置
const API_BASE_URL = 'http://localhost:8000';

// 預設的請求選項
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// 建立認證 header
export function createAuthHeader(username, password) {
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
}

// 通用 API 請求函數
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// 認證相關 API
export const authAPI = {
  login: async (username, password) => {
    const authHeader = createAuthHeader(username, password);
    return apiRequest('/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });
  },
};

// 檔案相關 API
export const fileAPI = {
  list: async (authHeader, prefix = '') => {
    const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    return apiRequest(`/files/list${params}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });
  },

  upload: async (authHeader, file, s3Key, storageClass = 'STANDARD') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('s3_key', s3Key);
    formData.append('storage_class', storageClass);

    return apiRequest('/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        // 不設置 Content-Type，讓瀏覽器自動設置 multipart/form-data
      },
      body: formData,
    });
  },

  download: async (authHeader, s3Key) => {
    const url = `${API_BASE_URL}/files/download/${encodeURIComponent(s3Key)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },

  delete: async (authHeader, s3Key) => {
    return apiRequest(`/files/${encodeURIComponent(s3Key)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });
  },

  search: async (authHeader, pattern, prefix = '') => {
    const params = new URLSearchParams();
    params.append('pattern', pattern);
    if (prefix) params.append('prefix', prefix);

    return apiRequest(`/files/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });
  },
};

export default { authAPI, fileAPI };
