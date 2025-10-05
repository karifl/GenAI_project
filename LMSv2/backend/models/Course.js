const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true,
        maxlength: [100, 'Course name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Course description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    instructor: {
        type: String,
        required: [true, 'Instructor name is required'],
        trim: true
    },
    duration: {
        type: Number,
        required: [true, 'Course duration is required'],
        min: [1, 'Duration must be at least 1 week']
    },
    enrolledStudents: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'completed'],
        default: 'active'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Course', courseSchema);