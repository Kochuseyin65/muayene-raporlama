const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authMiddleware = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

// GET /api/companies - Get all companies (Super Admin only)
router.get('/', 
  authMiddleware, 
  requirePermission('superAdmin'), 
  companyController.getAllCompanies
);

// GET /api/companies/profile - Get current user's company profile
router.get('/profile', 
  authMiddleware, 
  companyController.getCompanyProfile
);

// GET /api/companies/:id - Get company by ID
router.get('/:id', 
  authMiddleware, 
  requirePermission('companyAdmin'), 
  companyController.getCompany
);

// POST /api/companies - Create new company (Super Admin only)
router.post('/', 
  authMiddleware, 
  requirePermission('superAdmin'),
  companyController.createCompanyValidation,
  companyController.createCompany
);

// PUT /api/companies/:id - Update company
router.put('/:id', 
  authMiddleware, 
  requirePermission('companyAdmin'),
  companyController.updateCompanyValidation,
  companyController.updateCompany
);

// DELETE /api/companies/:id - Delete company (Super Admin only)
router.delete('/:id', 
  authMiddleware, 
  requirePermission('superAdmin'), 
  companyController.deleteCompany
);

module.exports = router;