const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureUploadDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage configuration for company logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/logos');
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const companyId = req.user.company_id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `company_${companyId}_${timestamp}${ext}`);
  }
});

// Storage configuration for inspection photos
const inspectionPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Support both routes that may use :id or :inspectionId
    const inspectionId = req.params.inspectionId || req.params.id;
    const uploadPath = path.join(__dirname, '../uploads/inspections', inspectionId);
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    cb(null, `inspection_${timestamp}_${randomStr}${ext}`);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları kabul edilir (JPEG, PNG, GIF, WebP)'), false);
  }
};

// Logo upload configuration
const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1
  }
});

// Inspection photos upload configuration
const uploadInspectionPhotos = multer({
  storage: inspectionPhotoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Maximum 10 files
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'Dosya boyutu çok büyük'
          }
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_FILES',
            message: 'Çok fazla dosya'
          }
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: {
            code: 'UNEXPECTED_FILE',
            message: 'Beklenmeyen dosya alanı'
          }
        });
      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: 'Dosya yükleme hatası'
          }
        });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message
      }
    });
  }
  next();
};

module.exports = {
  uploadLogo: uploadLogo.single('logo'),
  uploadInspectionPhotos: uploadInspectionPhotos.array('photos', 10),
  handleUploadError
};
