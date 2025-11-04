const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

async function createTestUser() {
    try {
        // Check if test user already exists
        const existingUser = await User.findByEmail('test@example.com');
        if (existingUser) {
            console.log('Test user already exists:', existingUser.email);
            return;
        }

        // Create test user
        const testUser = await User.create({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password123',
            role: 'instructor'
        });

        console.log('Test user created successfully:', testUser.email);
        console.log('You can now login with:');
        console.log('Email: test@example.com');
        console.log('Password: password123');
    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        mongoose.connection.close();
    }
}

createTestUser();
