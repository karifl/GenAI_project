const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or inactive user'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Middleware to check if user has required role
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Middleware to check if user is instructor of the course
const requireInstructorOfCourse = async (req, res, next) => {
    try {
        const Course = require('../models/Course');
        const course = await Course.findById(req.params.courseId || req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user is instructor of this course
        if (course.instructorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only modify courses you created'
            });
        }

        req.course = course;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error verifying course ownership',
            error: error.message
        });
    }
};

// Middleware to check if user is enrolled in course (for students)
const requireEnrollment = async (req, res, next) => {
    try {
        const Course = require('../models/Course');
        const course = await Course.findById(req.params.courseId || req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // If user is instructor, they have access
        if (course.instructorId.toString() === req.user._id.toString()) {
            req.course = course;
            return next();
        }

        // Check if student is enrolled
        const enrollment = req.user.enrolledCourses.find(
            enrollment => enrollment.courseId.toString() === course._id.toString()
        );

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course to access it'
            });
        }

        req.course = course;
        req.enrollment = enrollment;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error verifying enrollment',
            error: error.message
        });
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requireInstructorOfCourse,
    requireEnrollment
};
