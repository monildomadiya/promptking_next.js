import { SERVER_URL } from '../api';

export const optimizeImage = (url, width = 600) => {
  if (!url) return url;
  let rawUrl = url;
  if (url.startsWith(SERVER_URL)) {
    rawUrl = url.replace(SERVER_URL, '');
  }
  
  // Only optimize local uploads through our server to prevent CPU/bandwidth exhaustion
  if (rawUrl.startsWith('/uploads/')) {
    return `${SERVER_URL}/api/optimize?src=${encodeURIComponent(rawUrl)}&w=${width}`;
  }
  
  // Unsplash has its own optimization via Imgix
  if (rawUrl.includes('images.unsplash.com')) {
    // If the URL already has params, just return it, otherwise add basic formatting
    if (!rawUrl.includes('?')) {
      return `${rawUrl}?auto=format&fit=crop&q=80&w=${width}`;
    }
  }

  return url;
};
