const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

// GET /api/reports/public/:qrToken/download - Public PDF download (with fallback if unsigned)
router.get('/public/:qrToken/download',
  reportController.downloadPublicReport
);

// GET /api/reports/public/:qrToken - Public report view (QR Code)
router.get('/public/:qrToken', 
  reportController.getPublicReport
);

// PATCH /api/reports/:id/style - Update report style
router.patch('/:id/style',
  authMiddleware,
  requirePermission('viewReports'),
  reportController.updateReportStyle
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

// POST /api/reports/:id/prepare - Generate unsigned PDF for signing/download
router.post('/:id/prepare', 
  authMiddleware,
  requirePermission('viewReports'),
  reportController.prepareReportPdf
);

// POST /api/reports/:id/prepare-async - Enqueue background PDF generation
router.post('/:id/prepare-async',
  authMiddleware,
  requirePermission('viewReports'),
  reportController.enqueueReportPrepare
);

// GET /api/reports/jobs/:jobId - Check job status
router.get('/jobs/:jobId',
  authMiddleware,
  requirePermission('viewReports'),
  reportController.getReportJobStatus
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
