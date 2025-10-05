const mongoose = require('mongoose');

// Lesson Sub-Schema
const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Lesson title is required'],
        trim: true,
        maxlength: [100, 'Lesson title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Lesson description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    content: {
        type: String,
        required: [true, 'Lesson content is required']
    },
    order: {
        type: Number,
        required: true,
        default: 0
    },
    duration: {
        type: Number, // Duration in minutes
        required: [true, 'Lesson duration is required'],
        min: [1, 'Duration must be at least 1 minute']
    },
    videoUrl: {
        type: String,
        trim: true
    },
    materials: [{
        name: String,
        url: String,
        type: {
            type: String,
            enum: ['pdf', 'doc', 'video', 'link', 'other']
        }
    }],
    isPublished: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// Main Course Schema
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
    },
    lessons: [lessonSchema] // Embedded lessons
}, {
    timestamps: true
});

// Virtual property for total lesson count
courseSchema.virtual('lessonCount').get(function() {
    return this.lessons.length;
});

// Virtual property for total course duration from lessons
courseSchema.virtual('totalLessonDuration').get(function() {
    return this.lessons.reduce((total, lesson) => total + lesson.duration, 0);
});

// Ensure virtuals are included in JSON
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);
