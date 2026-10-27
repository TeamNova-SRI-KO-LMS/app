/**
 * Media utility functions for detecting and handling video and photo assets.
 */

/**
 * Detects whether a URL or filename points to a video.
 * @param {string} url
 * @returns {boolean}
 */
export const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.ogv', '.mov', '.m4v', '.mkv', '.avi'];
  if (videoExtensions.some((ext) => clean.endsWith(ext))) return true;
  if (url.startsWith('data:video/')) return true;
  if (/youtube\.com\/watch|youtu\.be|vimeo\.com/.test(url)) return true;
  return false;
};

/**
 * Detects whether a File object is a video.
 * @param {File} file
 * @returns {boolean}
 */
export const isVideoFile = (file) => {
  if (!file) return false;
  if (file.type && file.type.startsWith('video/')) return true;
  return /\.(mp4|webm|ogg|ogv|mov|m4v|mkv|avi)$/i.test(file.name || '');
};
