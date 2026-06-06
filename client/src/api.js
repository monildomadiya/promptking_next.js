

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  
  if (typeof window !== 'undefined' && 
      !window.location.hostname.includes('localhost') && 
      !window.location.hostname.includes('127.0.0.1')) {
    return ''; // Uses the same domain for API requests (e.g., https://promptking.in/api)
  }
  
  return 'http://localhost:5000';
};

export const SERVER_URL = getBaseUrl();

const api = {
  get: async (url, options = {}) => {
    const adminToken = localStorage.getItem('adminToken');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (adminToken) headers['x-admin-token'] = adminToken;
    
    const res = await fetch(`${SERVER_URL}/api${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'API Error');
    return { data: transformUploadPaths(data) };
  },
  post: async (url, body = {}, options = {}) => {
    const adminToken = localStorage.getItem('adminToken');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (body instanceof FormData) delete headers['Content-Type'];
    if (adminToken) headers['x-admin-token'] = adminToken;
    
    const res = await fetch(`${SERVER_URL}/api${url}`, {
      method: 'POST',
      ...options,
      headers,
      credentials: 'include',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'API Error');
    return { data: transformUploadPaths(data) };
  },
  delete: async (url, options = {}) => {
    const adminToken = localStorage.getItem('adminToken');
    const headers = {
      ...options.headers
    };
    if (adminToken) headers['x-admin-token'] = adminToken;
    
    // Note: Don't set Content-Type for DELETE if body is empty
    if (options.body) headers['Content-Type'] = 'application/json';
    
    const res = await fetch(`${SERVER_URL}/api${url}`, {
      method: 'DELETE',
      ...options,
      headers,
      credentials: 'include'
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'API Error');
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
