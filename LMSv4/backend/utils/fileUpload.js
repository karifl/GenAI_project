const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(uploadsDir, 'materials');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

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

// Configure multer
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

// Helper function to get file info
const getFileInfo = (file) => {
    return {
        name: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype
    };
};

// Helper function to delete file
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

// Helper function to serve file
const serveFile = (filePath, res) => {
    try {
        if (fs.existsSync(filePath)) {
            res.download(filePath);
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

module.exports = {
    uploadSingle,
    uploadMultiple,
    getFileInfo,
    deleteFile,
    serveFile
};
