import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  
  // Logic to detect if we are on the live site
  if (typeof window !== 'undefined' && 
      !window.location.hostname.includes('localhost') && 
      !window.location.hostname.includes('127.0.0.1')) {
    return 'https://promptking-q4qu.onrender.com';
  }
  
  // Local development — use the local backend
  return 'http://localhost:5000';
};

const SERVER_URL = getBaseUrl();

const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: true
});

api.interceptors.request.use(config => {
  const adminPin = localStorage.getItem('adminPin');
  if (adminPin) {
    config.headers['X-Admin-Pin'] = adminPin;
  }
  return config;
});

// Recursively prepend the SERVER_URL to any relative /uploads/ paths
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

// Intercept responses to map images automatically
api.interceptors.response.use(
  (response) => {
    response.data = transformUploadPaths(response.data);
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
