const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { uploadToStorage } = require('../services/supabaseStorageService');
const LectureMaterial = require('../models/LectureMaterial');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const EXT_MIME = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function getCategory(dirName, ext) {
  if (dirName.includes('video')) return 'video';
  if (dirName.includes('pdf')) return 'pdf';
  if (dirName.includes('thumb')) return 'thumbnail';
  if (dirName.includes('image')) return 'image';
  if (dirName.includes('assign')) return 'assignment';

  if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) return 'video';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
  return 'pdf';
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function migrate() {
  console.log('[Migration] Starting upload migration to Supabase Storage...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Migration] Connected to MongoDB');

  const files = getAllFiles(UPLOADS_DIR);
  console.log(`[Migration] Found ${files.length} local files in ${UPLOADS_DIR}`);

  for (const filePath of files) {
    try {
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const parentDir = path.basename(path.dirname(filePath)).toLowerCase();
      const type = getCategory(parentDir, ext);
      const mimeType = EXT_MIME[ext] || 'application/octet-stream';

      console.log(`[Migration] Uploading ${fileName} (${type}) to Supabase...`);
      const buffer = fs.readFileSync(filePath);
      const storageResult = await uploadToStorage(buffer, fileName, mimeType, type);

      console.log(`[Migration] Uploaded to: ${storageResult.viewUrl}`);

      // Update matching LectureMaterial records
      const updated = await LectureMaterial.updateMany(
        {
          $or: [
            { fileName: fileName },
            { viewUrl: new RegExp(fileName, 'i') },
            { embedUrl: new RegExp(fileName, 'i') },
            { downloadUrl: new RegExp(fileName, 'i') },
          ]
        },
        {
          $set: {
            viewUrl: storageResult.viewUrl,
            embedUrl: storageResult.embedUrl,
            downloadUrl: storageResult.downloadUrl,
            driveFileId: storageResult.fileId,
          }
        }
      );

      console.log(`[Migration] Updated ${updated.modifiedCount} LectureMaterial records for ${fileName}`);

      // Remove local file
      fs.unlinkSync(filePath);
      console.log(`[Migration] Removed local file ${filePath}`);
    } catch (err) {
      console.error(`[Migration] Error migrating file ${filePath}:`, err.message);
    }
  }

  // Check if any materials still reference /uploads/ or localhost
  const localMaterials = await LectureMaterial.find({
    $or: [
      { viewUrl: /uploads\// },
      { viewUrl: /localhost/ },
      { embedUrl: /uploads\// },
      { embedUrl: /localhost/ }
    ]
  });

  console.log(`[Migration] Remaining LectureMaterials referencing local URLs: ${localMaterials.length}`);

  await mongoose.disconnect();
  console.log('[Migration] Migration complete.');
}

if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = migrate;
