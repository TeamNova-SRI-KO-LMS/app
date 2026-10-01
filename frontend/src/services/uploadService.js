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
export async function uploadToSupabase(file, bucket = 'images', folder = '') {
  // Build a unique file path: [folder/]timestamp-random.ext
  const ext      = file.name.split('.').pop().toLowerCase();
  const unique   = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const filePath = folder ? `${folder}/${unique}.${ext}` : `${unique}.${ext}`;

  // Upload the file (upsert:true overwrites if path already exists)
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  // Get the permanent public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error('Could not retrieve public URL from Supabase.');
  }

  return data.publicUrl;
}

/**
 * Deletes a file from Supabase Storage by its full public URL.
 *
 * @param {string} publicUrl - The public URL previously returned by uploadToSupabase().
 * @param {string} bucket    - The Supabase bucket name the file is in.
 */
export async function deleteFromSupabase(publicUrl, bucket = 'images') {
  // Extract the file path from the URL:
  // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filePath>
  const marker = `/object/public/${bucket}/`;
  const idx    = publicUrl.indexOf(marker);

  if (idx === -1) return; // not a Supabase URL, skip

  const filePath = publicUrl.slice(idx + marker.length);

  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) {
    console.warn(`[uploadService] Could not delete file "${filePath}":`, error.message);
  }
}
