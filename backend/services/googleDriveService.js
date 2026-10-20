const { google } = require('googleapis');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

// Folder mapping
const FOLDERS = {
  thumbnail: process.env.GDRIVE_FOLDER_THUMBNAILS,
  video: process.env.GDRIVE_FOLDER_VIDEOS,
  pdf: process.env.GDRIVE_FOLDER_PDFS,
  image: process.env.GDRIVE_FOLDER_IMAGES,
  assignment: process.env.GDRIVE_FOLDER_ASSIGNMENTS,
};

/**
 * Get authenticated Google Drive client (supports both OAuth2 user refresh token and Service Account)
 */
function getDriveClient() {
  // 1. Prefer OAuth2 user credentials if refresh token is configured (uses user's personal 15GB quota)
  if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_ID) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:5000/api/auth/google/callback'
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // 2. Service Account credentials
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ],
    });

    return google.drive({ version: 'v3', auth });
  }

  return null;
}

/**
 * Generate best embed and preview URLs for a Google Drive file
 */
function getEmbedUrl(fileId, mimeType) {
  if (mimeType && mimeType.startsWith('image/')) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Local file fallback: saves file to /uploads/ folder if Google Drive quota is unavailable
 */
async function saveToLocalUploads(buffer, fileName, type = 'pdf') {
  const uploadSubDir = `${type}s`; // e.g. 'thumbnails', 'videos', 'pdfs', 'assignments'
  const uploadsBaseDir = path.join(__dirname, '..', 'uploads', uploadSubDir);

  await fs.promises.mkdir(uploadsBaseDir, { recursive: true });

  const sanitized = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const targetPath = path.join(uploadsBaseDir, sanitized);

  await fs.promises.writeFile(targetPath, buffer);

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const publicUrl = `${backendUrl}/uploads/${uploadSubDir}/${sanitized}`;

  return {
    fileId: `local_${Date.now()}`,
    isLocal: true,
    viewUrl: publicUrl,
    embedUrl: publicUrl,
    downloadUrl: publicUrl,
    fileName: sanitized,
    size: buffer.length,
  };
}

/**
 * Upload a file buffer to Google Drive (with automatic fallback to local uploads)
 * @param {Buffer} buffer - File buffer from Multer memoryStorage
 * @param {string} fileName - Original file name
 * @param {string} mimeType - e.g. 'video/mp4', 'application/pdf'
 * @param {string} type - 'video' | 'pdf' | 'image' | 'thumbnail' | 'assignment'
 * @returns {Promise<{fileId, viewUrl, embedUrl, downloadUrl, fileName, mimeType, size}>}
 */
async function uploadToDrive(buffer, fileName, mimeType, type = 'pdf') {
  if (!buffer) {
    throw new Error('No file buffer provided for upload.');
  }

  const drive = getDriveClient();

  if (drive) {
    try {
      const folderId = FOLDERS[type] || FOLDERS.pdf;
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);

      const sanitizedFileName = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;

      const requestBody = {
        name: sanitizedFileName,
        mimeType: mimeType || 'application/octet-stream',
      };

      if (folderId) {
        requestBody.parents = [folderId];
      }

      // Try uploading to Google Drive
      const response = await drive.files.create({
        supportsAllDrives: true,
        requestBody,
        media: {
          mimeType: mimeType || 'application/octet-stream',
          body: readableStream,
        },
        fields: 'id, name, size, webViewLink, webContentLink',
      });

      const fileId = response.data.id;

      // Make file publicly readable for student streaming
      try {
        await drive.permissions.create({
          fileId,
          supportsAllDrives: true,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (permError) {
        console.warn('[GoogleDriveService] Permission warning:', permError.message);
      }

      const viewUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
      const embedUrl = getEmbedUrl(fileId, mimeType);
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      return {
        fileId,
        isLocal: false,
        viewUrl,
        embedUrl,
        downloadUrl,
        fileName: response.data.name || sanitizedFileName,
        mimeType,
        size: response.data.size ? parseInt(response.data.size, 10) : buffer.length,
      };
    } catch (driveError) {
      console.warn(`[GoogleDriveService] Drive upload failed (${driveError.message}). Saving to secure local server storage...`);
      // If service account quota or drive permission error occurs, safely fallback to local storage
      const localResult = await saveToLocalUploads(buffer, fileName, type);
      return {
        ...localResult,
        mimeType,
      };
    }
  }

  // If no Drive configured, use local storage
  const localResult = await saveToLocalUploads(buffer, fileName, type);
  return {
    ...localResult,
    mimeType,
  };
}

/**
 * Delete a file from Google Drive or local storage
 */
async function deleteFromDrive(fileId) {
  if (!fileId) return;
  if (fileId.startsWith('local_')) return; // Local deletion can be handled if needed

  const drive = getDriveClient();
  if (!drive) return;

  try {
    await drive.files.delete({ fileId, supportsAllDrives: true });
    return true;
  } catch (error) {
    console.error(`[GoogleDriveService] Error deleting file ${fileId}:`, error.message);
  }
}

/**
 * Get file metadata from Google Drive
 */
async function getFileInfo(fileId) {
  if (!fileId || fileId.startsWith('local_')) return null;
  const drive = getDriveClient();
  if (!drive) return null;

  try {
    const res = await drive.files.get({
      fileId,
      supportsAllDrives: true,
      fields: 'id, name, size, mimeType, webViewLink, webContentLink',
    });
    return res.data;
  } catch (e) {
    return null;
  }
}

module.exports = {
  uploadToDrive,
  deleteFromDrive,
  getFileInfo,
  getEmbedUrl,
  getDriveClient,
};
