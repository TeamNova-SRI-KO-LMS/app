/**
 * Downscale an image in the browser before uploading it. Profile photos are stored in
 * the database, so keeping them small makes every page that shows them faster and keeps
 * uploads well under the API's 4.5 MB request limit on Vercel.
 *
 * Returns the original file when it is already small, isn't a raster image, or can't be
 * decoded by the browser.
 *
 * @param {File} file
 * @param {{ maxSize?: number, quality?: number }} [options] longest edge in px, JPEG quality
 * @returns {Promise<File>}
 */
export const resizeImageFile = async (file, { maxSize = 512, quality = 0.85 } = {}) => {
  if (!file?.type?.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 300 * 1024) {
    bitmap.close?.();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff'; // JPEG has no transparency
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob || blob.size >= file.size) {
    return file;
  }

  return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`, { type: 'image/jpeg' });
};
