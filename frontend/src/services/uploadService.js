import { supabase } from '../config/supabase';

/**
 * Uploads a file to a Supabase Storage bucket and returns its public URL.
 *
 * @param {File}   file      - The File object from an <input type="file"> element.
 * @param {string} bucket    - The Supabase bucket name (must already exist and be public).
 * @param {string} [folder]  - Optional sub-folder path inside the bucket, e.g. "avatars".
 * @returns {Promise<string>} The public URL of the uploaded file.
 *
 * @example
 * // Avatar upload
 * const url = await uploadToSupabase(file, 'images', 'avatars');
 *
 * @example
 * // Course thumbnail upload
 * const url = await uploadToSupabase(file, 'images', 'courses');
 */
export async function uploadToSupabase(file, bucket = (import.meta.env.VITE_SUPABASE_BUCKET || 'courses'), folder = '') {
  // Validate file
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Sanitize filename and create unique path
  const sanitizedName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : 'image';
  const ext = sanitizedName.split('.').pop()?.toLowerCase() || 'jpg';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const filePath = folder ? `${folder}/${unique}.${ext}` : `${unique}.${ext}`;

  // Helper to attempt upload on a specific bucket
  const attemptUpload = async (targetBucket) => {
    const { error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });
    return { uploadError };
  };

  let activeBucket = bucket;
  let { uploadError } = await attemptUpload(activeBucket);

  // If initial bucket fails (not found or policy violation), try alternate known buckets
  if (uploadError) {
    const candidateBuckets = ['courses', 'images', 'announcements'].filter(b => b !== activeBucket);
    for (const altBucket of candidateBuckets) {
      const retry = await attemptUpload(altBucket);
      if (!retry.uploadError) {
        activeBucket = altBucket;
        uploadError = null;
        break;
      }
    }
  }

  if (uploadError) {
    if (uploadError.message?.toLowerCase().includes('bucket not found') || uploadError.statusCode === '404' || uploadError.code === 'NoSuchBucket') {
      throw new Error(`Supabase bucket "${activeBucket}" was not found. Please create a public bucket named "${activeBucket}" in your Supabase Dashboard.`);
    }
    if (uploadError.statusCode === '403' || uploadError.code === 'AccessDenied' || uploadError.message?.toLowerCase().includes('policy')) {
      throw new Error(`Supabase storage access denied for bucket "${activeBucket}". Please ensure the bucket has public insert/upload policies enabled in Supabase.`);
    }
    throw new Error(`Supabase upload failed: ${uploadError.message || 'Unknown error'}`);
  }

  // Get the permanent public URL
  const { data } = supabase.storage.from(activeBucket).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error('Could not retrieve public URL from Supabase Storage.');
  }

  return data.publicUrl;
}

/**
 * Deletes a file from Supabase Storage by its full public URL.
 *
 * @param {string} publicUrl - The public URL previously returned by uploadToSupabase().
 * @param {string} [fallbackBucket='courses'] - The Supabase bucket name if not identifiable from URL.
 */
export async function deleteFromSupabase(publicUrl, fallbackBucket = 'courses') {
  if (!publicUrl || typeof publicUrl !== 'string') return;

  // Extract bucket and path from https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filePath>
  const match = publicUrl.match(/\/object\/public\/([^/]+)\/(.+)$/);
  const targetBucket = match ? match[1] : fallbackBucket;
  const filePath = match ? match[2] : null;

  if (!filePath) return;

  const { error } = await supabase.storage.from(targetBucket).remove([filePath]);
  if (error) {
    console.warn(`[uploadService] Could not delete file "${filePath}" from "${targetBucket}":`, error.message);
  }
}
