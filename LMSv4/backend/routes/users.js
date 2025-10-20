const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');

// ==================== USER ROUTES ====================

// GET all users (with pagination and filtering)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, role, isActive, search } = req.query;
        const query = {};

        // Build query based on filters
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            count: users.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// GET single user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// CREATE new user (Registration)
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, role = 'student' } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: user.getPublicProfile()
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// LOGIN user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        await user.updateLastLogin();

        res.json({
            success: true,
            message: 'Login successful',
            data: user.getPublicProfile()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

// UPDATE user
router.put('/:id', async (req, res) => {
    try {
        const { password, ...updateData } = req.body;

        // Don't allow password updates through this route
        if (password) {
            return res.status(400).json({
                success: false,
                message: 'Use /change-password route to update password'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

// CHANGE PASSWORD
router.put('/:id/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
});

// DELETE user (soft delete by deactivating)
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deactivated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deactivating user',
            error: error.message
        });
    }
});

// HARD DELETE user (permanent deletion)
router.delete('/:id/permanent', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User permanently deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// ==================== ENROLLMENT ROUTES ====================

// ENROLL user in a course
router.post('/:userId/enroll/:courseId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        const course = await Course.findById(req.params.courseId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user is already enrolled
        const existingEnrollment = user.enrolledCourses.find(
            enrollment => enrollment.courseId.toString() === req.params.courseId
        );

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'User is already enrolled in this course'
            });
        }

        // Add enrollment
        user.enrolledCourses.push({
            courseId: req.params.courseId,
            enrolledAt: new Date()
        });

        // Update course enrollment count
        course.enrolledStudents += 1;
        await course.save();
        await user.save();

        res.status(201).json({
            success: true,
            message: 'User enrolled successfully',
            data: {
                user: user.getPublicProfile(),
                course: course
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error enrolling user',
            error: error.message
        });
    }
});

// UNENROLL user from a course
router.delete('/:userId/enroll/:courseId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        const course = await Course.findById(req.params.courseId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Find and remove enrollment
        const enrollmentIndex = user.enrolledCourses.findIndex(
            enrollment => enrollment.courseId.toString() === req.params.courseId
        );

        if (enrollmentIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'User is not enrolled in this course'
            });
        }

        user.enrolledCourses.splice(enrollmentIndex, 1);

        // Update course enrollment count
        course.enrolledStudents = Math.max(0, course.enrolledStudents - 1);
        await course.save();
        await user.save();

        res.json({
            success: true,
            message: 'User unenrolled successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error unenrolling user',
            error: error.message
        });
    }
});

// GET user's enrolled courses
router.get('/:userId/courses', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('enrolledCourses.courseId')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            count: user.enrolledCourses.length,
            data: user.enrolledCourses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user courses',
            error: error.message
        });
    }
});

// UPDATE course progress
router.put('/:userId/courses/:courseId/progress', async (req, res) => {
    try {
        const { progress, status } = req.body;

        if (progress !== undefined && (progress < 0 || progress > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Progress must be between 0 and 100'
            });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const enrollment = user.enrolledCourses.find(
            enrollment => enrollment.courseId.toString() === req.params.courseId
        );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'User is not enrolled in this course'
            });
        }

        // Update progress and status
        if (progress !== undefined) enrollment.progress = progress;
        if (status) enrollment.status = status;

        await user.save();

        res.json({
            success: true,
            message: 'Course progress updated successfully',
            data: enrollment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating course progress',
            error: error.message
        });
    }
});

module.exports = router;

