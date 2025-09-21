const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const authMiddleware = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');
const { uploadInspectionPhotos: uploadPhotosMulter, handleUploadError } = require('../middleware/upload');

// GET /api/inspections - Get all inspections
router.get('/', 
  authMiddleware, 
  requireAnyPermission(['viewInspections', 'viewMyInspections']), 
  inspectionController.getInspections
);

// GET /api/inspections/check-availability - Check time slot availability
router.get('/check-availability', 
  authMiddleware, 
  requirePermission('viewInspections'), 
  inspectionController.checkTimeSlotAvailability
);

// POST /api/inspections - Create new inspection
router.post('/', 
  authMiddleware, 
  requirePermission('createWorkOrder'),
  inspectionController.createInspectionValidation,
  inspectionController.createInspection
);

// GET /api/inspections/:id - Get inspection by ID
router.get('/:id', 
  authMiddleware, 
  requirePermission('viewInspections'), 
  inspectionController.getInspection
);

// PUT /api/inspections/:id - Update inspection data
router.put('/:id', 
  authMiddleware, 
  requirePermission('editInspection'),
  inspectionController.updateInspectionValidation,
  inspectionController.updateInspection
);

// POST /api/inspections/:id/save - Save inspection (generate report)
router.post('/:id/save', 
  authMiddleware, 
  requirePermission('saveInspection'), 
  inspectionController.saveInspection
);

// POST /api/inspections/:id/complete - Complete inspection
router.post('/:id/complete', 
  authMiddleware, 
  requirePermission('completeInspection'), 
  inspectionController.completeInspection
);

// POST /api/inspections/:id/approve - Approve inspection (company admin)
router.post('/:id/approve',
  authMiddleware,
  requirePermission('companyAdmin'),
  inspectionController.approveInspection
);

// POST /api/inspections/:id/photos - Upload inspection photos
router.post('/:id/photos', 
  authMiddleware, 
  requirePermission('uploadPhotos'), 
  uploadPhotosMulter,
  handleUploadError,
  inspectionController.uploadInspectionPhotos
);

module.exports = router;
