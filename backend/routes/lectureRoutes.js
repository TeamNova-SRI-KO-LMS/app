const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const LectureMaterial = require('../models/LectureMaterial');
const Course = require('../models/Course');
const { uploadToDrive, deleteFromDrive } = require('../services/googleDriveService');

const router = express.Router();

// Configure multer memory storage (files held in RAM buffer before streaming to Google Drive)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max per file
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowed = [
      // Videos
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
      // Documents
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Archives
      'application/zip', 'application/x-zip-compressed',
    ];

    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${file.mimetype}" is not supported.`), false);
    }
  },
});

function getDriveType(mimeType) {
  if (!mimeType) return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  return 'pdf';
}

// ─────────────────────────────────────────────────────────────
// 1. ADMIN: Upload lecture material file to Google Drive
// POST /api/lectures/upload
// ─────────────────────────────────────────────────────────────
router.post('/upload', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const {
      courseId,
      weekNumber = 1,
      lessonIndex = 0,
      lessonTitle = 'General Lesson',
      title,
      description = '',
      isPreview = 'false',
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload.' });
    }

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Material title is required.' });
    }

    const driveType = getDriveType(req.file.mimetype);

    // Upload to Google Drive using Service Account
    const driveResult = await uploadToDrive(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      driveType
    );

    // Create record in MongoDB
    const material = await LectureMaterial.create({
      course: courseId,
      weekNumber: parseInt(weekNumber, 10) || 1,
      lessonIndex: parseInt(lessonIndex, 10) || 0,
      lessonTitle,
      title: title.trim(),
      description: description.trim(),
      type: driveType,
      driveFileId: driveResult.fileId,
      viewUrl: driveResult.viewUrl,
      embedUrl: driveResult.embedUrl,
      downloadUrl: driveResult.downloadUrl,
      fileName: driveResult.fileName,
      fileSizeBytes: driveResult.size,
      mimeType: req.file.mimetype,
      isPreview: isPreview === 'true' || isPreview === true,
      uploadedBy: req.user._id || req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Lecture material uploaded to Google Drive successfully.',
      material,
    });
  } catch (error) {
    console.error('[lectureRoutes] Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload material to Google Drive.',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. ADMIN: Upload Course Cover / Thumbnail to Google Drive
// POST /api/lectures/upload-thumbnail
// ─────────────────────────────────────────────────────────────
router.post('/upload-thumbnail', protect, authorize('admin'), upload.single('thumbnail'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file.' });
    }

    const driveResult = await uploadToDrive(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'thumbnail'
    );

    res.status(200).json({
      success: true,
      message: 'Thumbnail uploaded to Google Drive successfully.',
      url: driveResult.embedUrl,
      viewUrl: driveResult.viewUrl,
      fileId: driveResult.fileId,
    });
  } catch (error) {
    console.error('[lectureRoutes] Thumbnail upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload thumbnail to Google Drive.',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. ADMIN: Add external link (e.g. YouTube, Vimeo)
// POST /api/lectures/link
// ─────────────────────────────────────────────────────────────
router.post('/link', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      courseId,
      weekNumber = 1,
      lessonIndex = 0,
      lessonTitle = 'General Lesson',
      title,
      description = '',
      externalUrl,
      isPreview = 'false',
    } = req.body;

    if (!courseId || !title || !externalUrl) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, title, and external URL are required.',
      });
    }

    // Convert standard YouTube watch link to embed format
    let cleanUrl = externalUrl.trim();
    if (cleanUrl.includes('youtube.com/watch?v=')) {
      cleanUrl = cleanUrl.replace('watch?v=', 'embed/');
    } else if (cleanUrl.includes('youtu.be/')) {
      const vid = cleanUrl.split('youtu.be/')[1]?.split('?')[0];
      if (vid) cleanUrl = `https://www.youtube.com/embed/${vid}`;
    }

    const material = await LectureMaterial.create({
      course: courseId,
      weekNumber: parseInt(weekNumber, 10) || 1,
      lessonIndex: parseInt(lessonIndex, 10) || 0,
      lessonTitle,
      title: title.trim(),
      description: description.trim(),
      type: 'link',
      externalUrl: cleanUrl,
      embedUrl: cleanUrl,
      viewUrl: externalUrl,
      isPreview: isPreview === 'true' || isPreview === true,
      uploadedBy: req.user._id || req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'External link resource added successfully.',
      material,
    });
  } catch (error) {
    console.error('[lectureRoutes] Link error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. GET: Materials for a Course (Enrolled students or admin, or preview items)
// GET /api/lectures/course/:courseId
// ─────────────────────────────────────────────────────────────
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check course existence
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const materials = await LectureMaterial.find({ course: courseId })
      .sort({ weekNumber: 1, order: 1, createdAt: 1 })
      .populate('uploadedBy', 'name');

    res.status(200).json({
      success: true,
      count: materials.length,
      materials,
    });
  } catch (error) {
    console.error('[lectureRoutes] Get materials error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lecture materials.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. GET: Single Material by ID
// GET /api/lectures/:id
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const material = await LectureMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }
    res.status(200).json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. ADMIN: Delete a material (deletes from Google Drive & MongoDB)
// DELETE /api/lectures/:id
// ─────────────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const material = await LectureMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }

    // Delete from Google Drive if fileId exists
    if (material.driveFileId) {
      try {
        await deleteFromDrive(material.driveFileId);
      } catch (driveErr) {
        console.warn(`[lectureRoutes] Warning: Could not delete file ${material.driveFileId} from Drive:`, driveErr.message);
      }
    }

    await material.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Lecture material deleted from Google Drive and database.',
    });
  } catch (error) {
    console.error('[lectureRoutes] Delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete material.' });
  }
});

module.exports = router;
