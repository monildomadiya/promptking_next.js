import { SERVER_URL } from '../api';

export const optimizeImage = (url, width = 600) => {
  if (!url) return url;
  let rawUrl = url;
  if (url.startsWith(SERVER_URL)) {
    rawUrl = url.replace(SERVER_URL, '');
  }
  if (rawUrl.startsWith('/uploads/') || rawUrl.includes('images.unsplash.com') || rawUrl.includes('i.pinimg.com')) {
    return `${SERVER_URL}/api/optimize?src=${encodeURIComponent(rawUrl)}&w=${width}`;
  }
  return url;
};
