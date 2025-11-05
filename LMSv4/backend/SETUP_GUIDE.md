# LMS Setup Guide

## Quick Fix for Lesson Creation Issue

The lesson creation is failing because MongoDB is not running. Here's how to fix it:

### Step 1: Set Up Database

#### Option A: MongoDB Atlas (Recommended - Free Cloud Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create a free cluster (M0 Sandbox)
4. Get your connection string
5. Create `.env` file in backend directory with:
   ```env

   ```

#### Option B: Local MongoDB
1. Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Install and start the service
3. Create `.env` file in backend directory with:
   ```env

   ```

### Step 2: Test the Setup

1. **Test database connection:**
   ```bash
   node setup-database.js
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Test lesson creation:**
   ```bash
   node test-lesson.js
   ```

### Step 3: Use the Application

1. Open frontend in browser
2. Register as instructor
3. Create a course
4. Add lessons (this will now work!)

## What Was Fixed

- ✅ Dependencies installed (Cloudinary, etc.)
- ✅ File upload system configured
- ✅ Role-based access control implemented
- ❌ MongoDB database connection (needs setup)

Once MongoDB is running, the lesson creation will work perfectly!
