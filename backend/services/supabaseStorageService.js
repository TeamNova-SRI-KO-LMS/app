const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'lecture-materials';

// Folder mapping inside the Supabase Storage bucket
const FOLDERS = {
  thumbnail: 'thumbnails',
  video: 'videos',
  pdf: 'pdfs',
  image: 'images',
  assignment: 'assignments',
};

/**
 * Returns an authenticated Supabase client
 */
function getStorageClient() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('[SupabaseStorageService] SUPABASE_URL or keys not configured in environment.');
    return null;
  }
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Clean and extract the relative path inside the Supabase bucket from a fileId, key, or URL
 * @param {string} identifier - fileId, full URL, or relative storage path
 * @returns {string} clean relative storage path
 */
function extractStoragePath(identifier) {
  if (!identifier) return '';

  let clean = identifier.trim();

  // Strip query parameters if present (e.g. ?download=...)
  if (clean.includes('?')) {
    clean = clean.split('?')[0];
  }

  // Strip prefix like "lecture-materials:"
  if (clean.startsWith(`${BUCKET_NAME}:`)) {
    clean = clean.replace(`${BUCKET_NAME}:`, '');
  }

  // If it's a full Supabase CDN URL, extract the path after /lecture-materials/
  const bucketMarker = `/${BUCKET_NAME}/`;
  if (clean.includes(bucketMarker)) {
    clean = clean.substring(clean.indexOf(bucketMarker) + bucketMarker.length);
  }

  // Remove leading slashes
  clean = clean.replace(/^\/+/, '');

  return clean;
}

/**
 * Upload a file buffer directly to Supabase Storage bucket
 * @param {Buffer} buffer - File buffer from Multer memoryStorage
 * @param {string} fileName - Original file name
 * @param {string} mimeType - e.g. 'video/mp4', 'application/pdf', 'image/png'
 * @param {string} type - 'video' | 'pdf' | 'image' | 'thumbnail' | 'assignment'
 * @returns {Promise<{fileId: string, isLocal: boolean, viewUrl: string, embedUrl: string, downloadUrl: string, fileName: string, mimeType: string, size: number}>}
 */
async function uploadToStorage(buffer, fileName, mimeType, type = 'pdf') {
  if (!buffer) {
    throw new Error('No file buffer provided for Supabase Storage upload.');
  }

  const supabase = getStorageClient();
  if (!supabase) {
    throw new Error('Supabase Storage client is not configured.');
  }

  const folder = FOLDERS[type] || 'pdfs';
  // Sanitize filename to prevent invalid characters in Supabase paths
  const sanitizedOriginal = (fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueFileName = `${Date.now()}_${sanitizedOriginal}`;
  const filePath = `${folder}/${uniqueFileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType || 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    console.error(`[SupabaseStorageService] Upload failed for ${filePath}:`, error.message);
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  // Generate permanent public CDN URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;
  const downloadUrl = `${publicUrl}?download=${encodeURIComponent(fileName || uniqueFileName)}`;

  return {
    fileId: filePath,
    isLocal: false,
    viewUrl: publicUrl,
    embedUrl: publicUrl,
    downloadUrl,
    fileName: uniqueFileName,
    mimeType: mimeType || 'application/octet-stream',
    size: buffer.length,
  };
}

/**
 * Delete a file from Supabase Storage bucket
 * @param {string} fileIdOrUrl - The storage file path or full Supabase URL
 * @returns {Promise<boolean>}
 */
async function deleteFromStorage(fileIdOrUrl) {
  if (!fileIdOrUrl) return false;

  const storagePath = extractStoragePath(fileIdOrUrl);
  if (!storagePath) return false;

  const supabase = getStorageClient();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.warn(`[SupabaseStorageService] Warning deleting file ${storagePath}:`, error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[SupabaseStorageService] Error deleting file ${storagePath}:`, err.message);
    return false;
  }
}

module.exports = {
  uploadToStorage,
  deleteFromStorage,
  extractStoragePath,
  getStorageClient,
  // Aliases for backward compatibility
  uploadToDrive: uploadToStorage,
  deleteFromDrive: deleteFromStorage,
  BUCKET_NAME,
};
