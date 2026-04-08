

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  
  if (typeof window !== 'undefined' && 
      !window.location.hostname.includes('localhost') && 
      !window.location.hostname.includes('127.0.0.1')) {
    return 'https://promptking-q4qu.onrender.com';
  }
  
  return 'http://localhost:5000';
};

const SERVER_URL = getBaseUrl();

const api = {
  get: async (url, options = {}) => {
    const adminPin = localStorage.getItem('adminPin');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (adminPin) headers['X-Admin-Pin'] = adminPin;
    
    const res = await fetch(`${SERVER_URL}/api${url}`, {
      ...options,
      headers
    });
    
    const data = await res.json();
    return { data: transformUploadPaths(data) };
  },
  post: async (url, body = {}, options = {}) => {
    const adminPin = localStorage.getItem('adminPin');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (adminPin) headers['X-Admin-Pin'] = adminPin;
    
    const res = await fetch(`${SERVER_URL}/api${url}`, {
      method: 'POST',
      ...options,
      headers,
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    return { data: transformUploadPaths(data) };
  }
};

const transformUploadPaths = (data) => {
  if (!data) return data;
  if (typeof data === 'string' && data.startsWith('/uploads/')) {
    return `${SERVER_URL}${data}`;
  }
  if (Array.isArray(data)) {
    return data.map(item => transformUploadPaths(item));
  }
  if (typeof data === 'object' && data !== null) {
    const newData = {};
    for (const key in data) {
      newData[key] = transformUploadPaths(data[key]);
    }
    return newData;
  }
  return data;
};

export default api;
