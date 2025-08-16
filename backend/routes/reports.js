const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

// GET /api/reports/public/:qrToken - Public report view (QR Code)
router.get('/public/:qrToken', 
  reportController.getPublicReport
);

// GET /api/reports/:id - Get report by ID
router.get('/:id', 
  authMiddleware, 
  requirePermission('viewReports'), 
  reportController.getReport
);

// GET /api/reports/:id/download - Download report PDF
router.get('/:id/download', 
  authMiddleware, 
  requirePermission('downloadReports'), 
  reportController.downloadReport
);

// GET /api/reports/:id/signing-data - Get signing data for e-signature
router.get('/:id/signing-data', 
  authMiddleware, 
  requirePermission('signReports'), 
  reportController.getSigningData
);

// POST /api/reports/:id/sign - Sign report with e-signature
router.post('/:id/sign', 
  authMiddleware, 
  requirePermission('signReports'),
  reportController.signReportValidation,
  reportController.signReport
);

// POST /api/reports/:id/send - Send report to customer
router.post('/:id/send', 
  authMiddleware, 
  requirePermission('sendReports'), 
  reportController.sendReport
);

module.exports = router;