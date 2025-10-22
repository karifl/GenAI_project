const mongoose = require('mongoose');
const Course = require('./models/Course');
const User = require('./models/User');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

async function testLessonCreation() {
    try {
        // Find or create a test course
        let course = await Course.findOne({ name: 'Test Course' });
        if (!course) {
            // Find a test user first
            const user = await User.findOne({ email: 'test@example.com' });
            if (!user) {
                console.log('Please run test-user.js first to create a test user');
                return;
            }
            
            course = await Course.create({
                name: 'Test Course',
                description: 'A test course for debugging',
                instructor: user.fullName,
                instructorId: user._id,
                duration: 4,
                status: 'active'
            });
            console.log('Test course created:', course._id);
        }
        
        // Test lesson creation
        const lessonData = {
            title: 'Test Lesson',
            description: 'A test lesson',
            content: 'This is test content',
            duration: 30,
            isPublished: true,
            downloadableMaterials: []
        };
        
        course.lessons.push(lessonData);
        await course.save();
        
        console.log('✅ Test lesson created successfully');
        console.log('Course ID:', course._id);
        console.log('Lesson count:', course.lessons.length);
        
    } catch (error) {
        console.error('❌ Error creating test lesson:', error);
    } finally {
        mongoose.connection.close();
    }
}

testLessonCreation();