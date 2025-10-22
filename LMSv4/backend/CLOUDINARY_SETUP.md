# Cloudinary Setup Guide

## Environment Variables Required

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lms_database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Server Configuration
PORT=5000
NODE_ENV=development
```

## How to Get Cloudinary Credentials

1. **Sign up for Cloudinary**: Go to [cloudinary.com](https://cloudinary.com) and create a free account
2. **Get your credentials**: After signing up, go to your dashboard
3. **Copy the credentials**:
   - Cloud Name: Found in the dashboard
   - API Key: Found in the dashboard
   - API Secret: Found in the dashboard

## Features

- **Automatic file upload** to Cloudinary cloud storage
- **File optimization** with automatic quality and format optimization
- **Secure file access** through Cloudinary URLs
- **File deletion** from Cloudinary when removed from the system
- **Multiple file types** supported (PDF, DOC, images, videos, etc.)
- **File size limits** (50MB maximum)

## File Storage Structure

Files are stored in Cloudinary with the following structure:
- **Folder**: `lms-materials`
- **Organization**: Files are automatically organized by upload date
- **Access**: Files are accessible via secure Cloudinary URLs

## Benefits

- **Scalable storage** - No local storage limitations
- **Global CDN** - Fast file delivery worldwide
- **Automatic optimization** - Images and videos are optimized automatically
- **Secure access** - Files are served through secure Cloudinary URLs
- **Easy management** - Files can be managed through Cloudinary dashboard
