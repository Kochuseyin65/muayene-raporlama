const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { uploadLogo, uploadInspectionPhotos, handleUploadError } = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');

// POST /api/uploads/company-logo - Upload company logo
router.post('/company-logo', 
  authMiddleware, 
  requirePermission('companyAdmin'),
  uploadLogo,
  handleUploadError,
  uploadController.uploadCompanyLogo
);

// POST /api/uploads/inspection-photos/:inspectionId - Upload inspection photos
router.post('/inspection-photos/:inspectionId', 
  authMiddleware, 
  requirePermission('uploadPhotos'),
  uploadInspectionPhotos,
  handleUploadError,
  uploadController.uploadInspectionPhotos
);

// DELETE /api/uploads/inspection-photos/:inspectionId/:photoFilename - Delete inspection photo
router.delete('/inspection-photos/:inspectionId/:photoFilename', 
  authMiddleware, 
  requireAnyPermission(['companyAdmin', 'uploadPhotos']),
  uploadController.deleteInspectionPhoto
);

// GET /api/uploads/logos/:filename - Serve logo files
router.get('/logos/:filename', 
  uploadController.getUploadedFile
);

// GET /api/uploads/inspections/:inspectionId/:filename - Serve inspection photos
router.get('/inspections/:inspectionId/:filename', 
  uploadController.getUploadedFile
);

module.exports = router;