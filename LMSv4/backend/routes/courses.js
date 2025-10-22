const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { authenticateToken, requireRole, requireInstructorOfCourse, requireEnrollment } = require('../middleware/auth');
const { uploadSingle, getFileInfo, serveFile, deleteFile } = require('../utils/cloudinaryUpload');

// ==================== COURSE ROUTES ====================

// GET all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
});

// GET single course by ID
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching course',
            error: error.message
        });
    }
});

// CREATE new course (Instructors only)
router.post('/', authenticateToken, requireRole('instructor', 'admin'), async (req, res) => {
    try {
        const courseData = {
            ...req.body,
            instructorId: req.user._id,
            instructor: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`
        };
        
        const course = await Course.create(courseData);
        
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating course',
            error: error.message
        });
    }
});

// UPDATE course (Instructors only - their own courses)
router.put('/:id', authenticateToken, requireRole('instructor', 'admin'), requireInstructorOfCourse, async (req, res) => {
    try {
        const updateData = {
            ...req.body,
            instructor: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`
        };
        
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );
        
        res.json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating course',
            error: error.message
        });
    }
});

// DELETE course (Instructors only - their own courses)
router.delete('/:id', authenticateToken, requireRole('instructor', 'admin'), requireInstructorOfCourse, async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        
        res.json({
            success: true,
            message: 'Course deleted successfully',
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting course',
            error: error.message
        });
    }
});

// ==================== LESSON ROUTES ====================

// GET all lessons for a course (Students need enrollment, Instructors need ownership)
router.get('/:courseId/lessons', authenticateToken, requireEnrollment, async (req, res) => {
    try {
        res.json({
            success: true,
            count: req.course.lessons.length,
            data: req.course.lessons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching lessons',
            error: error.message
        });
    }
});

// GET single lesson (Students need enrollment, Instructors need ownership)
router.get('/:courseId/lessons/:lessonId', authenticateToken, requireEnrollment, async (req, res) => {
    try {
        const lesson = req.course.lessons.id(req.params.lessonId);
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        res.json({
            success: true,
            data: lesson
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching lesson',
            error: error.message
        });
    }
});

// CREATE new lesson (Instructors only - their own courses)
router.post('/:courseId/lessons', authenticateToken, requireRole('instructor', 'admin'), requireInstructorOfCourse, uploadSingle, async (req, res) => {
    try {
        console.log('Creating lesson for course:', req.params.courseId);
        console.log('Lesson data:', req.body);
        console.log('File uploaded:', !!req.file);
        
        // Set order based on current lesson count
        req.body.order = req.course.lessons.length + 1;
        
        // Handle file upload if present
        if (req.file) {
            console.log('Processing file upload:', req.file.originalname);
            const materialInfo = getFileInfo(req.file);
            console.log('File info:', materialInfo);
            req.body.downloadableMaterials = [materialInfo];
        } else {
            // Initialize empty downloadableMaterials array if no file
            req.body.downloadableMaterials = [];
            console.log('No file uploaded, using empty downloadableMaterials array');
        }
        
        console.log('Adding lesson to course...');
        req.course.lessons.push(req.body);
        await req.course.save();
        
        const newLesson = req.course.lessons[req.course.lessons.length - 1];
        console.log('Lesson created successfully:', newLesson._id);
        
        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: newLesson
        });
    } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating lesson',
            error: error.message
        });
    }
});

// UPDATE lesson (Instructors only - their own courses)
router.put('/:courseId/lessons/:lessonId', authenticateToken, requireRole('instructor', 'admin'), requireInstructorOfCourse, async (req, res) => {
    try {
        const lesson = req.course.lessons.id(req.params.lessonId);
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        // Update lesson fields
        Object.keys(req.body).forEach(key => {
            lesson[key] = req.body[key];
        });
        
        await req.course.save();
        
        res.json({
            success: true,
            message: 'Lesson updated successfully',
            data: lesson
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating lesson',
            error: error.message
        });
    }
});

// DELETE lesson (Instructors only - their own courses)
router.delete('/:courseId/lessons/:lessonId', authenticateToken, requireRole('instructor', 'admin'), requireInstructorOfCourse, async (req, res) => {
    try {
        const lesson = req.course.lessons.id(req.params.lessonId);
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        lesson.deleteOne();
        await req.course.save();
        
        res.json({
            success: true,
            message: 'Lesson deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting lesson',
            error: error.message
        });
    }
});

// ==================== FILE UPLOAD/DOWNLOAD ROUTES ====================

// UPLOAD course material (Instructors only - their own courses)
router.post('/:courseId/materials', authenticateToken, requireRole('instructor', 'admin'), requireInstructorOfCourse, uploadSingle, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const materialInfo = getFileInfo(req.file);
        req.course.materials.push(materialInfo);
        await req.course.save();

        res.status(201).json({
            success: true,
            message: 'Course material uploaded successfully',
            data: materialInfo
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error uploading course material',
            error: error.message
        });
    }
});

// UPLOAD lesson material (Instructors only - their own courses)
router.post('/:courseId/lessons/:lessonId/materials', authenticateToken, requireRole('instructor', 'admin'), requireInstructorOfCourse, uploadSingle, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const lesson = req.course.lessons.id(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        const materialInfo = getFileInfo(req.file);
        lesson.downloadableMaterials.push(materialInfo);
        await req.course.save();

        res.status(201).json({
            success: true,
            message: 'Lesson material uploaded successfully',
            data: materialInfo
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error uploading lesson material',
            error: error.message
        });
    }
});

// DOWNLOAD course material (Students need enrollment, Instructors need ownership)
router.get('/:courseId/materials/:materialId/download', authenticateToken, requireEnrollment, async (req, res) => {
    try {
        const material = req.course.materials.id(req.params.materialId);
        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        serveFile(material.cloudinaryUrl || material.filePath, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error downloading material',
            error: error.message
        });
    }
});

// DOWNLOAD lesson material (Students need enrollment, Instructors need ownership)
router.get('/:courseId/lessons/:lessonId/materials/:materialId/download', authenticateToken, requireEnrollment, async (req, res) => {
    try {
        const lesson = req.course.lessons.id(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        const material = lesson.downloadableMaterials.id(req.params.materialId);
        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        serveFile(material.cloudinaryUrl || material.filePath, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error downloading material',
            error: error.message
        });
    }
});

// DELETE course material (Instructors only - their own courses)
router.delete('/:courseId/materials/:materialId', authenticateToken, requireRole('instructor', 'admin'), requireInstructorOfCourse, async (req, res) => {
    try {
        const material = req.course.materials.id(req.params.materialId);
        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Delete file from Cloudinary
        await deleteFile(material.cloudinaryId);

        // Remove from database
        material.deleteOne();
        await req.course.save();

        res.json({
            success: true,
            message: 'Course material deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting material',
            error: error.message
        });
    }
});

// DELETE lesson material (Instructors only - their own courses)
router.delete('/:courseId/lessons/:lessonId/materials/:materialId', authenticateToken, requireRole('instructor', 'admin'), requireInstructorOfCourse, async (req, res) => {
    try {
        const lesson = req.course.lessons.id(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        const material = lesson.downloadableMaterials.id(req.params.materialId);
        if (!material) {
            return res.status(404).json({
                success: false,
                message: 'Material not found'
            });
        }

        // Delete file from Cloudinary
        await deleteFile(material.cloudinaryId);

        // Remove from database
        material.deleteOne();
        await req.course.save();

        res.json({
            success: true,
            message: 'Lesson material deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting material',
            error: error.message
        });
    }
});

module.exports = router;
