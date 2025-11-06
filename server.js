const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Note: Files are now served from Cloudinary, no local static file serving needed

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_database', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
const courseRoutes = require('./routes/courses');
const userRoutes = require('./routes/users');

app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to LMS API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: err.message 
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});