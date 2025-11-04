const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

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

// CREATE new course
router.post('/', async (req, res) => {
    try {
        const course = await Course.create(req.body);
        
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

// UPDATE course
router.put('/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
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

// DELETE course
router.delete('/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
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

// GET all lessons for a course
router.get('/:courseId/lessons', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.json({
            success: true,
            count: course.lessons.length,
            data: course.lessons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching lessons',
            error: error.message
        });
    }
});

// GET single lesson
router.get('/:courseId/lessons/:lessonId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        const lesson = course.lessons.id(req.params.lessonId);
        
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

// CREATE new lesson
router.post('/:courseId/lessons', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Set order based on current lesson count
        req.body.order = course.lessons.length + 1;
        
        course.lessons.push(req.body);
        await course.save();
        
        const newLesson = course.lessons[course.lessons.length - 1];
        
        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: newLesson
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating lesson',
            error: error.message
        });
    }
});

// UPDATE lesson
router.put('/:courseId/lessons/:lessonId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        const lesson = course.lessons.id(req.params.lessonId);
        
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
        
        await course.save();
        
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

// DELETE lesson
router.delete('/:courseId/lessons/:lessonId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        const lesson = course.lessons.id(req.params.lessonId);
        
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }
        
        lesson.deleteOne();
        await course.save();
        
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

module.exports = router;
