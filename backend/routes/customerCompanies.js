const express = require('express');
const router = express.Router();
const customerCompanyController = require('../controllers/customerCompanyController');
const authMiddleware = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');

// GET /api/customer-companies - Get all customer companies
router.get('/', 
  authMiddleware, 
  requirePermission('viewCustomers'), 
  customerCompanyController.getCustomerCompanies
);

// GET /api/customer-companies/:id - Get customer company by ID
router.get('/:id', 
  authMiddleware, 
  requirePermission('viewCustomers'), 
  customerCompanyController.getCustomerCompany
);

// POST /api/customer-companies - Create new customer company
router.post('/', 
  authMiddleware, 
  requirePermission('createCustomer'),
  customerCompanyController.createCustomerCompanyValidation,
  customerCompanyController.createCustomerCompany
);

// PUT /api/customer-companies/:id - Update customer company
router.put('/:id', 
  authMiddleware, 
  requirePermission('editCustomer'),
  customerCompanyController.updateCustomerCompanyValidation,
  customerCompanyController.updateCustomerCompany
);

// DELETE /api/customer-companies/:id - Delete customer company
router.delete('/:id', 
  authMiddleware, 
  requireAnyPermission(['companyAdmin', 'editCustomer']), 
  customerCompanyController.deleteCustomerCompany
);

module.exports = router;