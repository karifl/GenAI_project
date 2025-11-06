const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
    return process.env.CLOUDINARY_CLOUD_NAME && 
           process.env.CLOUDINARY_API_KEY && 
           process.env.CLOUDINARY_API_SECRET;
};

if (!isCloudinaryConfigured()) {
    console.warn('⚠️  Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
}

// Log Cloudinary configuration status
console.log('Cloudinary configuration:');
console.log('- Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing');
console.log('- API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
console.log('- API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');

// Configure Cloudinary storage for multer
let storage;
if (isCloudinaryConfigured()) {
    try {
        storage = new CloudinaryStorage({
            cloudinary: cloudinary,
            params: {
                folder: 'lms-materials', // Folder in Cloudinary
                allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip', 'mp4', 'avi', 'mov', 'mp3', 'wav'],
                transformation: [
                    { width: 1000, height: 1000, crop: 'limit' }, // Resize images if needed
                    { quality: 'auto' } // Optimize quality
                ]
            }
        });
        console.log('✅ Cloudinary storage configured successfully');
    } catch (error) {
        console.error('❌ Error configuring Cloudinary storage:', error);
        storage = null;
    }
} else {
    console.log('⚠️  Cloudinary not configured, using local storage');
    storage = null;
}

// Fallback to local storage if Cloudinary is not available
if (!storage) {
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = path.join(uploadsDir, 'materials');
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
    console.log('📁 Using local storage fallback');
}

// File filter to allow only certain file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'audio/mpeg',
        'audio/wav',
        'application/zip',
        'application/x-rar-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only documents, images, videos, and archives are allowed.'), false);
    }
};

// Configure multer with Cloudinary storage
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Middleware for single file upload
const uploadSingle = upload.single('file');

// Middleware for multiple file uploads
const uploadMultiple = upload.array('files', 10); // Max 10 files

// Helper function to get file info from Cloudinary or local storage
const getFileInfo = (file) => {
    const isCloudinary = file.path && file.path.includes('cloudinary.com');
    
    console.log('File info:', {
        originalname: file.originalname,
        filename: file.filename,
        path: file.path,
        public_id: file.public_id,
        isCloudinary: isCloudinary,
        allFileProperties: Object.keys(file)
    });
    
    // Extract public_id from Cloudinary URL if not directly available
    let cloudinaryId = '';
    let cloudinaryUrl = '';
    
    if (isCloudinary) {
        cloudinaryUrl = file.path || '';
        // Try to get public_id from file object or extract from URL
        cloudinaryId = file.public_id || '';
        
        // If public_id is not available, try to extract from URL
        if (!cloudinaryId && cloudinaryUrl) {
            const urlParts = cloudinaryUrl.split('/');
            console.log('Chopping the URL Parts:', urlParts);
            const filename = urlParts[urlParts.length - 1];
            console.log('Chopping the Filename:', filename);
            cloudinaryId = filename.split('.')[0]; // Remove extension
        }
    } else {
        // File is stored locally, not on Cloudinary
        console.log('📁 File stored locally, not on Cloudinary');
        cloudinaryId = ''; // No Cloudinary ID for local files
        cloudinaryUrl = ''; // No Cloudinary URL for local files
    }
    
    return {
        name: file.originalname,
        fileName: file.filename,
        filePath: file.path, // Cloudinary URL or local path
        fileSize: file.size,
        mimeType: file.mimetype,
        cloudinaryId: cloudinaryId,
        cloudinaryUrl: cloudinaryUrl,
    };
};

// Helper function to delete file from Cloudinary
const deleteFile = async (cloudinaryId) => {
    try {
        if (cloudinaryId) {
            const result = await cloudinary.uploader.destroy(cloudinaryId);
            return result.result === 'ok';
        }
        return false;
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return false;
    }
};

// Helper function to serve file (redirect to Cloudinary URL or serve local file)
const serveFile = (filePath, res) => {
    try {
        if (filePath) {
            // Check if it's a Cloudinary URL
            if (filePath.includes('cloudinary.com')) {
                res.redirect(filePath);
            } else {
                // It's a local file, serve it directly
                const fs = require('fs');
                const path = require('path');
                
                if (fs.existsSync(filePath)) {
                    res.download(filePath);
                } else {
                    res.status(404).json({
                        success: false,
                        message: 'File not found'
                    });
                }
            }
        } else {
            res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error serving file',
            error: error.message
        });
    }
};

// Helper function to get optimized image URL
const getOptimizedImageUrl = (cloudinaryUrl, options = {}) => {
    if (!cloudinaryUrl) return null;
    
    const defaultOptions = {
        width: options.width || 'auto',
        height: options.height || 'auto',
        quality: options.quality || 'auto',
        format: options.format || 'auto'
    };
    
    // Extract public_id from Cloudinary URL
    const urlParts = cloudinaryUrl.split('/');
    const publicId = urlParts[urlParts.length - 1].split('.')[0];
    
    return cloudinary.url(publicId, defaultOptions);
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    getFileInfo,
    deleteFile,
    serveFile,
    getOptimizedImageUrl,
    cloudinary
};
