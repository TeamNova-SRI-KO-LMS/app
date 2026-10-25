const express = require('express');
const multer = require('multer');
const { protect, authorize, optionalAuth, hasCourseAccess } = require('../middleware/auth');
const LectureMaterial = require('../models/LectureMaterial');
const Course = require('../models/Course');
const { uploadToStorage, deleteFromStorage } = require('../services/supabaseStorageService');

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

    const storageType = getDriveType(req.file.mimetype);

    // Upload directly to Supabase Storage bucket
    const storageResult = await uploadToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      storageType
    );

    // Create record in MongoDB
    const material = await LectureMaterial.create({
      course: courseId,
      weekNumber: parseInt(weekNumber, 10) || 1,
      lessonIndex: parseInt(lessonIndex, 10) || 0,
      lessonTitle,
      title: title.trim(),
      description: description.trim(),
      type: storageType,
      driveFileId: storageResult.fileId,
      viewUrl: storageResult.viewUrl,
      embedUrl: storageResult.embedUrl,
      downloadUrl: storageResult.downloadUrl,
      fileName: storageResult.fileName,
      fileSizeBytes: storageResult.size,
      mimeType: req.file.mimetype,
      isPreview: isPreview === 'true' || isPreview === true,
      uploadedBy: req.user._id || req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Lecture material uploaded to Supabase Storage successfully.',
      material,
    });
  } catch (error) {
    console.error('[lectureRoutes] Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload material to Supabase Storage.',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. ADMIN: Upload Course Cover / Thumbnail to Supabase Storage
// POST /api/lectures/upload-thumbnail
// ─────────────────────────────────────────────────────────────
router.post('/upload-thumbnail', protect, authorize('admin'), upload.single('thumbnail'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image file.' });
    }

    const storageResult = await uploadToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'thumbnail'
    );

    res.status(200).json({
      success: true,
      message: 'Thumbnail uploaded to Supabase Storage successfully.',
      url: storageResult.embedUrl,
      viewUrl: storageResult.viewUrl,
      fileId: storageResult.fileId,
    });
  } catch (error) {
    console.error('[lectureRoutes] Thumbnail upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload thumbnail to Supabase Storage.',
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
// 4. GET: Materials for a Course (Enrolled students or admin get full access; unenrolled only see titles and public preview videos)
// GET /api/lectures/course/:courseId
// ─────────────────────────────────────────────────────────────
router.get('/course/:courseId', optionalAuth, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check course existence
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const isAuthorized = hasCourseAccess(req.user, course);

    const materials = await LectureMaterial.find({ course: courseId })
      .sort({ weekNumber: 1, order: 1, createdAt: 1 })
      .populate('uploadedBy', 'name');

    // If enrolled student, instructor, or admin: return all materials with full streaming/download URLs
    if (isAuthorized) {
      return res.status(200).json({
        success: true,
        count: materials.length,
        isEnrolled: true,
        materials: materials.map((m) => {
          const doc = m.toObject ? m.toObject() : { ...m };
          doc.isLocked = false;
          return doc;
        }),
      });
    }

    // Unenrolled visitors/students: can only see topics & titles, and can ONLY watch videos admin accepted for everyone (isPreview: true)
    const sanitizedMaterials = materials.map((m) => {
      const doc = m.toObject ? m.toObject() : { ...m };
      if (doc.isPreview) {
        // Free preview video published for everyone by admin -> full playback URLs included
        doc.isLocked = false;
        return doc;
      }

      // Not published for everyone -> strip streaming URLs, download URLs, and Drive file IDs
      return {
        _id: doc._id,
        course: doc.course,
        weekNumber: doc.weekNumber,
        lessonIndex: doc.lessonIndex,
        lessonTitle: doc.lessonTitle,
        title: doc.title,
        description: doc.description,
        type: doc.type,
        isPreview: false,
        isLocked: true,
        fileSizeBytes: doc.fileSizeBytes,
        createdAt: doc.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      count: sanitizedMaterials.length,
      isEnrolled: false,
      materials: sanitizedMaterials,
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
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const material = await LectureMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }

    // If admin accepted for everyone (isPreview: true), allow anyone to view/watch
    if (material.isPreview) {
      return res.status(200).json({ success: true, material });
    }

    // Otherwise, user must be enrolled in the course or be admin/instructor
    const course = await Course.findById(material.course);
    if (!course || !hasCourseAccess(req.user, course)) {
      return res.status(403).json({
        success: false,
        message: 'This video is only available to enrolled students. Please enroll to watch.',
      });
    }

    res.status(200).json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. ADMIN: Toggle preview / public status of lecture material
// PATCH /api/lectures/:id/toggle-preview
// ─────────────────────────────────────────────────────────────
router.patch('/:id/toggle-preview', protect, authorize('admin'), async (req, res) => {
  try {
    const material = await LectureMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }

    material.isPreview = !material.isPreview;
    await material.save();

    res.status(200).json({
      success: true,
      message: `Material is now ${material.isPreview ? 'published for everyone (Free Preview)' : 'restricted to enrolled students only'}`,
      isPreview: material.isPreview,
      material,
    });
  } catch (error) {
    console.error('[lectureRoutes] Toggle preview error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle preview status.' });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. ADMIN: Delete a material (deletes from Supabase Storage & MongoDB)
// DELETE /api/lectures/:id
// ─────────────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const material = await LectureMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }

    // Delete from Supabase Storage if fileId or viewUrl exists
    const fileIdentifier = material.driveFileId || material.viewUrl;
    if (fileIdentifier && material.type !== 'link') {
      try {
        await deleteFromStorage(fileIdentifier);
      } catch (storageErr) {
        console.warn(`[lectureRoutes] Warning: Could not delete file ${fileIdentifier} from Supabase:`, storageErr.message);
      }
    }

    await material.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Lecture material deleted from Supabase Storage and database.',
    });
  } catch (error) {
    console.error('[lectureRoutes] Delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete material.' });
  }
});

module.exports = router;
