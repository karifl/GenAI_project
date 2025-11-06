const mongoose = require('mongoose');

// Database connection function
async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB Connected Successfully');
        return true;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.log('\n📋 To fix this issue:');
        console.log('1. Install MongoDB Community Server from: https://www.mongodb.com/try/download/community');
        console.log('2. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
        console.log('3. Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
        return false;
    }
}

// Test database connection
async function testConnection() {
    console.log('🔍 Testing database connection...');
    const connected = await connectDatabase();
    
    if (connected) {
        console.log('✅ Database connection successful!');
        console.log('You can now start the server with: npm start');
    } else {
        console.log('❌ Database connection failed!');
        console.log('Please install MongoDB or use MongoDB Atlas before running the server.');
    }
    
    process.exit(connected ? 0 : 1);
}

testConnection();
